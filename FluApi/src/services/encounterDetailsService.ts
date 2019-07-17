// Copyright (c) 2018, 2019 by Audere
//
// Use of this source code is governed by an MIT-style license that
// can be found in the LICENSE file distributed with this file.

import Sequelize, { Op } from "sequelize";
import logger from "../util/logger";
import { HutchUploadModel } from "../models/db/hutchUpload";
import { PIIEncounterDetails } from "../models/encounterDetails";
import { FeverModels } from "../models/db/fever";
import {
  SnifflesModels,
  VisitNonPIIInstance,
  VisitPIIInstance
} from "../models/db/sniffles";
import { filterResponsePII } from "./sniffles/piiFilter";
import { EventInfoKind as FeverEvents } from "audere-lib/feverProtocol";
import {
  ResponseInfo,
  EventInfoKind as SnifflesEvents
} from "audere-lib/snifflesProtocol";
import { TelecomInfoSystem } from "audere-lib/common";
import moment from "moment";
import { FollowUpSurveyData } from "../external/redCapClient";

export enum Release {
  Fever = "fever",
  Sniffles = "sniffles"
}

export interface KeyedEncounter<T> {
  key: EncounterKey;
  encounter: T;
}

export interface EncounterKey {
  id: number;
  release: Release;
}

/**
 * Consolidates the view of a visit across PII & non-PII storage.
 */
export class EncounterDetailsService {
  private readonly feverModels: FeverModels;
  private readonly snifflesModels: SnifflesModels;
  private readonly hutchUploadModel: HutchUploadModel;

  constructor(
    feverModels: FeverModels,
    snifflesModels: SnifflesModels,
    hutchUploadModel: HutchUploadModel
  ) {
    this.feverModels = feverModels;
    this.snifflesModels = snifflesModels;
    this.hutchUploadModel = hutchUploadModel;
  }

  public async retrieveDetails(): Promise<
    KeyedEncounter<PIIEncounterDetails>[]
  > {
    const details: KeyedEncounter<PIIEncounterDetails>[] = [];

    const [sniffles, fever] = [
      await this.retrievePendingVisits(),
      await this.retrievePendingSurveys()
    ];

    fever.forEach((v, k) => {
      details.push({ key: { release: Release.Fever, id: k }, encounter: v });
    });

    sniffles.forEach((v, k) => {
      details.push({ key: { release: Release.Sniffles, id: k }, encounter: v });
    });

    return details;
  }

  public async retrievePendingSurveys(): Promise<
    Map<number, PIIEncounterDetails>
  > {
    const nonPiiSurveys = await this.feverModels.surveyNonPii.findAll({
      where: {
        [Op.and]: [
          {
            survey: {
              isDemo: false
            }
          },
          Sequelize.literal("json_array_length(survey->'samples') > 0"),
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
      order: [["id", "ASC"]]
    });

    const piiSurveys = await this.feverModels.surveyPii.findAll({
      where: {
        csruid: nonPiiSurveys.map(survey => survey.csruid)
      }
    });

    const emails: string[] = [].concat.apply(
      [],
      piiSurveys.map(s =>
        s.survey.patient.telecom
          .filter(f => f.system === TelecomInfoSystem.Email)
          .map(f => f.value)
      )
    );

    const followUpSurveys = await this.feverModels.followUpSurveys.findAll({
      where: {
        email: emails
      }
    });

    const zipped: Map<number, PIIEncounterDetails> = new Map();

    // Discard records missing complementary PII data.
    nonPiiSurveys.forEach(nonPii => {
      const pii = piiSurveys.find(p => p.csruid == nonPii.csruid);

      if (pii != null && pii.survey != null) {
        let appNav = nonPii.survey.events.filter(
          e => e.kind === FeverEvents.AppNav
        );

        let startTime = appNav.reduce<string>(
          (acc, x) => (x.at < acc ? acc : x.at),
          undefined
        );

        let consentDate: string;
        if (pii.survey.consents != null && pii.survey.consents.length > 0) {
          consentDate = pii.survey.consents
            .map(x => x.date)
            .reduce((prev, curr) => (prev > curr ? curr : prev));
        }

        const email =
          pii.survey.patient.telecom.length > 0
            ? pii.survey.patient.telecom[0].value
            : undefined;

        let followUpSurvey: FollowUpSurveyData;
        if (email != null) {
          followUpSurvey = followUpSurveys
            .map(s => <FollowUpSurveyData>s.survey)
            .find(s => s.email === email);
        }

        zipped.set(+nonPii.id, {
          id: +nonPii.id,
          csruid: nonPii.csruid,
          consentDate: consentDate,
          startTime: startTime,
          site: "self-test",
          responses: nonPii.survey.responses,
          addresses: pii.survey.patient.address.map(a => ({
            use: a.use,
            value: a
          })),
          samples: nonPii.survey.samples,
          events: appNav,
          birthDate: pii.survey.patient.birthDate,
          gender: pii.survey.patient.gender,
          firstName: pii.survey.patient.firstName,
          lastName: pii.survey.patient.lastName,
          followUpResponses: followUpSurvey
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

  /**
   * Retrieve all completed visits that have not yet been uploaded.
   */
  public async retrievePendingVisits(): Promise<
    Map<number, PIIEncounterDetails>
  > {
    const now = moment();
    const staleDate = now.subtract(2, "days").format("YYYY-MM-DD");

    // Filters by joining to HutchUpload and looking for records with no match.
    // HutchUpload exists only in the Non-PII database.
    const nonPiiVisits = await this.snifflesModels.visitNonPii.findAll({
      where: {
        [Op.and]: [
          {
            visit: {
              isDemo: false
            }
          },
          // Either completed or over two days old
          {
            [Op.or]: [
              {
                visit: {
                  complete: "true"
                }
              },
              {
                updatedAt: {
                  [Op.lt]: staleDate
                }
              }
            ]
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
      order: [["id", "ASC"]]
    });

    // Query the second database for the PII data associated to the visit.
    const piiVisits = await this.snifflesModels.visitPii.findAll({
      where: {
        csruid: nonPiiVisits.map(visit => visit.csruid)
      }
    });

    const zipped: Map<number, PIIEncounterDetails> = new Map();

    // Discard records missing complementary PII data.
    nonPiiVisits.forEach(nonPii => {
      const pii = piiVisits.find(p => p.csruid == nonPii.csruid);

      if (pii != null && pii.visit != null) {
        let startTime: string;
        if (nonPii.visit.events != null) {
          const e = nonPii.visit.events.find(
            e => e.kind === SnifflesEvents.Visit
          );

          if (e != null) {
            startTime = e.at;
          }
        }

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
          startTime: startTime,
          site: nonPii.visit.location,
          responses: nonPiiResponses(nonPii, pii),
          addresses: pii.visit.patient.address.map(a => ({
            use: a.use,
            value: a
          })),
          samples: nonPii.visit.samples,
          events: [],
          birthDate: pii.visit.patient.birthDate,
          gender: pii.visit.patient.gender,
          fullName: pii.visit.patient.name
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

  /**
   * Writes a record of an upload to the database to indicate completeness for
   * this workflow.
   * @param ids Database identifiers for the records successfully uploaded.
   */
  public async commitUploads(keys: EncounterKey[]): Promise<void> {
    const uploads = [];

    (keys || []).forEach(k => {
      if (k.release === "sniffles") {
        uploads.push({ visitId: k.id });
      } else {
        uploads.push({ surveyId: k.id });
      }
    });

    if (uploads.length === 0) {
      return;
    }

    await this.hutchUploadModel.bulkCreate(uploads);
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
