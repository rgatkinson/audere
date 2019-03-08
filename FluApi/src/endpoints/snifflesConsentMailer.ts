import Sequelize, { Op } from "sequelize";

import { defineConsentEmail, ConsentEmailModel } from "../models/consentEmail";
import { defineSnifflesModels, SnifflesModels } from "../models/sniffles";
import logger from "../util/logger";
import { SplitSql } from "../util/sql";
import { emailConsent } from "../util/visit";

const MAX_EMAILS_PER_REQUEST = 100;

export class ConsentEmailerEndpoint {
  private readonly snifflesModels: SnifflesModels;
  private readonly consentEmailModel: ConsentEmailModel;

  constructor(sql: SplitSql) {
    this.snifflesModels = defineSnifflesModels(sql);
    this.consentEmailModel = defineConsentEmail(sql);
  }

  public sendConsentEmails = async (req, res, next) => {
    const { nonPiiVisits, piiVisits } = await this.getUnEmailedVisits(
      MAX_EMAILS_PER_REQUEST
    );

    const consentEmailResults = await Promise.all(
      nonPiiVisits.map(async nonPiiVisit => {
        const piiVisit = piiVisits.find(
          piiVisit => piiVisit.csruid === nonPiiVisit.csruid
        );
        if (!piiVisit) {
          logger.error(`No PII found for visit id #${nonPiiVisit.id}`);
          return {
            visitId: nonPiiVisit.id,
            emailRequested: false,
            consentsSent: 0
          };
        }
        try {
          const emailResult = await emailConsent(
            piiVisit.visit,
            nonPiiVisit.visit
          );
          return {
            visitId: nonPiiVisit.id,
            emailRequested: emailResult.emailRequsted,
            consentsSent: emailResult.consentsEmailed || 0
          };
        } catch (e) {
          logger.error(
            `Error sending consent email for visit id ${nonPiiVisit.id}:`
          );
          logger.error(e);
          return {
            error: true,
            visitId: nonPiiVisit.id,
            emailRequested: false,
            consentsSent: 0
          };
        }
      })
    );

    await this.consentEmailModel.bulkCreate(
      consentEmailResults.filter(result => !result.error)
    );

    res.json(
      consentEmailResults.reduce(
        (results, nextResult) => {
          if (nextResult.error) {
            results.error++;
          } else if (nextResult.emailRequested) {
            results.sent++;
          } else {
            results.skipped++;
          }
          return results;
        },
        { sent: 0, skipped: 0, error: 0 }
      )
    );
  };

  private async getUnEmailedVisits(maxToGet) {
    const nonPiiVisits = await this.snifflesModels.visitNonPii.findAll({
      where: {
        visit: {
          complete: {
            [Op.eq]: "true"
          }
        },
        "$consent_email.id$": null
      },
      include: [
        {
          model: this.consentEmailModel,
          required: false
        }
      ],
      limit: maxToGet,
      order: [["id", "ASC"]]
    });

    const piiVisits = await this.snifflesModels.visitPii.findAll({
      where: {
        csruid: nonPiiVisits.map(visit => visit.csruid),
        visit: {
          complete: {
            [Op.eq]: "true"
          }
        }
      }
    });
    return { nonPiiVisits, piiVisits };
  }
}
