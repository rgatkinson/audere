// Copyright (c) 2018, 2019 by Audere
//
// Use of this source code is governed by an MIT-style license that
// can be found in the LICENSE file distributed with this file.

import Sequelize, { Op } from "sequelize";
import logger from "../../util/logger";
import { HutchUploadModel } from "../../models/db/hutchUpload";
import { PIIVisitDetails } from "../../models/visitDetails";
import {
  SnifflesModels,
  VisitNonPIIInstance,
  VisitPIIInstance
} from "../../models/db/sniffles";
import { ResponseInfo } from "audere-lib/dist/snifflesProtocol";
import { filterResponsePII } from "./piiFilter";
import { RequestContext } from "../../util/requestContext";

/**
 * Consolidates the view of a visit across PII & non-PII storage.
 */
export class VisitsService {
  private readonly snifflesModels: SnifflesModels;
  private readonly hutchUploadModel: HutchUploadModel;

  constructor(models: SnifflesModels, hutchUploadModel: HutchUploadModel) {
    this.snifflesModels = models;
    this.hutchUploadModel = hutchUploadModel;
  }

  /**
   * Retrieve all completed visits that have not yet been uploaded.
   * @param numToRetrieve The target number of records to retrieve from the db.
   * Enforces this as the maximum but only makes a best effort.
   */
  public async retrievePendingDetails(
    numToRetrieve: number
  ): Promise<Map<number, PIIVisitDetails>> {
    // Filters by joining to HutchUpload and looking for records with no match.
    // HutchUpload exists only in the Non-PII database.
    const nonPiiVisits = await this.snifflesModels.visitNonPii.findAll({
      where: {
        [Op.and]: [
          {
            visit: {
              isDemo: false,
              complete: "true"
            }
          },
          {
            [Op.or]: [
              Sequelize.literal(
                "(visit->'events')::jsonb @> '[{\"refId\":\"CompletedQuestionnaire\"}]'"
              ),
              Sequelize.literal("json_array_length(visit->'samples') > 0")
            ]
          },
          {
            "$hutch_upload.id$": null
          }
        ]
      },
      include: [
        {
          model: this.hutchUploadModel,
          required: false
        }
      ],
      limit: numToRetrieve,
      order: [["id", "ASC"]]
    });

    // Query the second database for the PII data associated to the visit.
    const piiVisits = await this.snifflesModels.visitPii.findAll({
      where: {
        csruid: nonPiiVisits.map(visit => visit.csruid),
        visit: {
          complete: "true"
        }
      }
    });

    const zipped: Map<number, PIIVisitDetails> = new Map();

    // Discard records missing complementary PII data.
    nonPiiVisits.forEach(nonPii => {
      const pii = piiVisits.find(p => p.csruid == nonPii.csruid);
      if (pii != null && pii.visit != null) {
        let consentDate: string;
        if (pii.visit.consents != null && pii.visit.consents.length > 0) {
          consentDate = pii.visit.consents
            .map(x => x.date)
            .reduce((prev, curr) => (prev > curr ? curr : prev));
        }

        zipped.set(+nonPii.id, {
          id: +nonPii.id,
          csruid: nonPii.csruid,
          consentDate: consentDate,
          visitInfo: {
            ...nonPii.visit,
            responses: nonPiiResponses(nonPii, pii)
          },
          patientInfo: pii.visit.patient
        });
      } else {
        logger.error(
          "A completed visit was found without corresponding PII " +
            " completion data, csruid " +
            nonPii.csruid
        );
      }
    });

    return zipped;
  }
}

function nonPiiResponses(
  nonPii: VisitNonPIIInstance,
  pii: VisitPIIInstance
): ResponseInfo[] {
  if (nonPii.visit.responses.length === 1 && pii.visit.responses.length === 1) {
    // There have been changes over time in the definition of what is PII or not, so
    // re-combine all responses and re-filter.
    return [
      {
        ...nonPii.visit.responses,
        item: [
          ...nonPii.visit.responses[0].item,
          ...pii.visit.responses[0].item
        ]
      }
    ].map(filterResponsePII(false));
  } else {
    logger.warn(
      `Unexpected responses format on ${
        nonPii.csruid
      }, returning existing nonPii`
    );
    return nonPii.visit.responses;
  }
}
