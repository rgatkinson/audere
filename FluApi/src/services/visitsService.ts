// Copyright (c) 2018 by Audere
//
// Use of this source code is governed by an MIT-style license that
// can be found in the LICENSE file distributed with this file.

import * as Model from "../models/visit";
import { HutchUpload } from "../models/hutchUpload";
import { PIIVisitDetails } from "../models/visitDetails";
import Sequelize from "sequelize";
import logger from "../util/logger";

/**
 * Consolidates the view of a visit across PII & non-PII storage.
 */
export class VisitsService {
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
    const v1 = Model.VisitNonPII.findAll({
      where: {
        visit: {
          complete: {
            [Sequelize.Op.eq]: "true"
          }
        },
        "$hutch_upload.id$": null
      },
      include: [
        {
          model: HutchUpload,
          required: false
        }
      ],
      limit: numToRetrieve,
      order: [["id", "ASC"]]
    });

    // Query the second database for the PII data associated to the visit.
    const v2 = v1.then(v => {
      return Model.VisitPII.findAll({
        where: {
          csruid: v.map(visit => visit.csruid),
          visit: {
            complete: {
              [Sequelize.Op.eq]: "true"
            }
          }
        }
      });
    });

    const [nonPiiVisits, piiVisits] = await Promise.all([v1, v2]);
    const zipped: Map<number, PIIVisitDetails> = new Map();

    // Discard records missing complementary PII data.
    nonPiiVisits.forEach(v => {
      const pii = piiVisits.find(p => p.csruid == v.csruid);
      if (pii != null && pii.visit != null) {
        let consentDate: string
        if (pii.visit.consents != null && pii.visit.consents.length > 0) {
          consentDate = pii.visit.consents
            .map(x => x.date)
            .reduce((prev, curr) => prev > curr ? curr : prev);
        }

        zipped.set(+v.id, {
          id: +v.id,
          csruid: v.csruid,
          consentDate: consentDate,
          visitInfo: v.visit,
          patientInfo: pii.visit.patient
        });
      } else {
        logger.error(
          "A completed visit was found without corresponding PII " +
          " completion data, csruid " + v.csruid
        );
      }
    });

    return zipped;
  }
}
