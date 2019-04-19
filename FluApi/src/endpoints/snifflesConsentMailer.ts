import { Op } from "sequelize";

import {
  defineConsentEmail,
  ConsentEmailModel
} from "../models/db/consentEmail";
import {
  defineSnifflesModels,
  SnifflesModels,
  VisitPIIInstance,
  VisitNonPIIInstance
} from "../models/db/sniffles";
import logger from "../util/logger";
import { SplitSql } from "../util/sql";
import { emailConsent } from "../util/visit";

const MAX_EMAILS_PER_REQUEST = 100;
const SIGNATURE_REQUIRED_LOCATIONS = [
  "ChildrensHospitalSeattle",
  "ChildrensHospitalBellevue"
];

type SendConsentEmailResult = {
  error?: boolean;
  emailRequested: boolean;
  emailResent: boolean;
  consentsSent: number;
  signaturesSent: boolean;
  visitId: string;
};

export class ConsentEmailerEndpoint {
  private readonly snifflesModels: SnifflesModels;
  private readonly consentEmailModel: ConsentEmailModel;

  constructor(sql: SplitSql) {
    this.snifflesModels = defineSnifflesModels(sql);
    this.consentEmailModel = defineConsentEmail(sql);
  }

  public sendConsentEmails = async (req, res, next) => {
    let visitsToResend = await this.getVisitsToResend(MAX_EMAILS_PER_REQUEST);
    const resentConsentEmailResults = await Promise.all(
      visitsToResend.nonPiiVisits.map(nonPiiVisit =>
        this.sendApplicableConsentEmail(
          this.getPii(visitsToResend.piiVisits, nonPiiVisit),
          nonPiiVisit,
          true
        )
      )
    );

    await this.consentEmailModel.update(
      { signaturesSent: true },
      {
        where: {
          visitId: resentConsentEmailResults.map(result =>
            result.visitId.toString()
          )
        }
      }
    );

    const { nonPiiVisits, piiVisits } = await this.getUnEmailedVisits(
      MAX_EMAILS_PER_REQUEST
    );

    const consentEmailResults = await Promise.all(
      nonPiiVisits.map(nonPiiVisit =>
        this.sendApplicableConsentEmail(
          this.getPii(piiVisits, nonPiiVisit),
          nonPiiVisit,
          false
        )
      )
    );

    await this.consentEmailModel.bulkCreate(
      consentEmailResults
        .filter(result => !result.error)
        .map(result => ({
          emailRequested: result.emailRequested,
          visitId: result.visitId,
          signaturesSent: result.signaturesSent,
          consentsSent: result.consentsSent
        }))
    );

    res.json(
      [...consentEmailResults, ...resentConsentEmailResults].reduce(
        (results, nextResult) => {
          if (nextResult.error) {
            results.error++;
          } else if (nextResult.emailRequested) {
            results.sent++;
            if (nextResult.emailResent) {
              results.resent++;
            }
          } else {
            results.skipped++;
          }
          return results;
        },
        { sent: 0, resent: 0, skipped: 0, error: 0 }
      )
    );
  };

  private getPii(
    piiVisits: VisitPIIInstance[],
    nonPiiVisit: VisitNonPIIInstance
  ) {
    return piiVisits.find(piiVisit => piiVisit.csruid === nonPiiVisit.csruid);
  }

  private async sendApplicableConsentEmail(
    piiVisit: VisitPIIInstance,
    nonPiiVisit: VisitNonPIIInstance,
    includeResendingMessage: boolean
  ): Promise<SendConsentEmailResult> {
    if (!piiVisit) {
      logger.error(`No PII found for visit id #${nonPiiVisit.id}`);
      return {
        visitId: nonPiiVisit.id,
        emailRequested: false,
        emailResent: false,
        consentsSent: 0,
        signaturesSent: false
      };
    }
    const includeSignatures = SIGNATURE_REQUIRED_LOCATIONS.includes(
      piiVisit.visit.location
    );
    try {
      const emailResult = await emailConsent(
        piiVisit.visit,
        nonPiiVisit.visit,
        includeSignatures,
        includeResendingMessage
      );
      return {
        visitId: nonPiiVisit.id,
        emailRequested: emailResult.emailRequsted,
        emailResent: includeResendingMessage,
        consentsSent: emailResult.consentsEmailed || 0,
        signaturesSent: includeSignatures
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
        emailResent: false,
        consentsSent: 0,
        signaturesSent: false
      };
    }
  }

  private async addAllPii(nonPiiVisits: VisitNonPIIInstance[]) {
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

    return await this.addAllPii(nonPiiVisits);
  }

  private async getVisitsToResend(maxToGet) {
    const nonPiiVisits = await this.snifflesModels.visitNonPii.findAll({
      where: {
        visit: {
          complete: {
            [Op.eq]: "true"
          },
          location: {
            [Op.in]: SIGNATURE_REQUIRED_LOCATIONS
          }
        },
        "$consent_email.signatures_sent$": false
      },
      include: [
        {
          model: this.consentEmailModel,
          required: true
        }
      ],
      limit: maxToGet,
      order: [["id", "ASC"]]
    });

    return await this.addAllPii(nonPiiVisits);
  }
}
