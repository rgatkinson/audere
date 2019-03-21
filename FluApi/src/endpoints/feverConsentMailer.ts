// Copyright (c) 2019 by Audere
//
// Use of this source code is governed by an MIT-style license that
// can be found in the LICENSE file distributed with this file.

import { Op } from "sequelize";
import {
  FeverModels,
  defineFeverModels,
  SurveyAttributes,
  ConsentEmailAttributes,
  querySurveyJoinConsentEmail
} from "../models/db/fever";
import { SplitSql, Inst } from "../util/sql";
import {
  PIIInfo,
  SurveyNonPIIInfo,
  TelecomInfoSystem
} from "audere-lib/feverProtocol";
import { Emailer } from "../util/email";
import logger from "../util/logger";

export class FeverConsentEmailerEndpoint {
  private readonly models: FeverModels;
  private readonly emailer: Emailer;

  constructor(sql: SplitSql, emailer?: Emailer) {
    this.models = defineFeverModels(sql);
    this.emailer = emailer || new Emailer();
  }

  public handleGet = async (req, res, next) => {
    res.json(await this.sendEmails());
  };

  public async sendEmails(): Promise<ConsentEmailAttributes[]> {
    let summary = [];
    while (true) {
      info("loading");
      const piis = await newSurveys(this.models);
      if (piis.length === 0) {
        info("done");
        break;
      }
      const piisById = new Map(piis.map(x => [x.id, x] as [string, SurveyPii]));

      dbg(`loading non-pii for ${piis.length} surveys`);
      const nonPiis = await this.models.surveyNonPii.findAll({
        where: {
          csruid: piis.map(x => x.csruid)
        }
      });
      const nonPiisByCSRUID = new Map(
        nonPiis.map(x => [x.csruid, x] as [string, SurveyNonPii])
      );

      info(`processing ${piis.length} surveys`);
      const rows = await this.models.consentEmail.bulkCreate(
        piis.map(pii => ({ survey_id: pii.id })),
        { returning: true }
      );

      const results: ConsentEmailAttributes[] = [];
      for (let row of rows) {
        const pii = piisById.get(row.survey_id);
        const nonPii = nonPiisByCSRUID.get(pii.csruid);
        results.push(await this.processSurvey(row, pii, nonPii));
      }
      summary = [...summary, ...results];
    }
    return summary;
  }

  private async processSurvey(
    row: ConsentEmailAttributes,
    pii: SurveyPii,
    nonPii: SurveyNonPii
  ): Promise<ConsentEmailAttributes> {
    const survey_id = pii.id;
    dbgrow(survey_id, "starting");

    try {
      if (didRequestEmail(nonPii)) {
        dbgrow(survey_id, "emailing");
        await emailConsent(this.emailer, pii);
        dbgrow(survey_id, "completing");
      } else {
        dbgrow(survey_id, "completing without email");
      }
      const update = {
        survey_id,
        completed: new Date().toISOString()
      };
      await this.models.consentEmail.upsert(update);
      return update;
    } catch (err) {
      logger.error(
        `${D_PREFIX}[${survey_id}]: not completing because '${err}'`
      );
      return row;
    }
  }
}

export async function newSurveys(models: FeverModels) {
  return querySurveyJoinConsentEmail(models, {
    where: {
      survey: {
        isDemo: false,
        consents: { [Op.ne]: "[]" },
        patient: {
          telecom: { [Op.ne]: "[]" }
        },
        workflow: {
          screeningCompletedAt: { [Op.ne]: null }
        }
      },
      "$fever_consent_emails.id$": null
    },
    limit: 1,
    order: [["id", "ASC"]]
  });
}

async function emailConsent(emailer: Emailer, survey: SurveyPii) {
  const participantEmail = getEmail(survey);
  const consentDate = getConsentDate(survey);
  const consentTerms = getConsentTerms(survey);
  const text = `Thank you for participating in the flu@home study! As requested, we are emailing you a copy of the consent form you agreed to.

Please contact us at unsubscribe@auderenow.org to unsubscribe from future emails, or contact flu-support@auderenow.org if you have any other questions or concerns.

Here is a copy of the Consent Form you accepted:

Agreed on ${consentDate}:
${consentTerms}`;
  await emailer.send({
    to: [participantEmail],
    from: "flu-support@auderenow.org",
    subject: "flu@home Research Study Consent Form",
    text
  });
}

function didRequestEmail(row: SurveyNonPii): boolean {
  const item = row.survey.responses[0].item.find(r => r.id === "Consent");
  return item && item.answer.some(a => a.valueBoolean);
}

function getEmail(row: SurveyPii): string {
  return row.survey.patient.telecom.find(
    x => x.system === TelecomInfoSystem.Email
  ).value;
}

function getConsentDate(row: SurveyPii): string {
  return row.survey.consents[0].date;
}

function getConsentTerms(row: SurveyPii): string {
  return row.survey.consents[0].terms;
}

type SurveyPii = Inst<SurveyAttributes<PIIInfo>> | SurveyAttributes<PIIInfo>;
type SurveyNonPii =
  | Inst<SurveyAttributes<SurveyNonPIIInfo>>
  | SurveyAttributes<SurveyNonPIIInfo>;

const D_PREFIX = "FeverConsentEmailer";

function dbg(text: string) {
  logger.debug(`${D_PREFIX}: ${text}`);
}

function dbgrow(rowId: string, text: string) {
  logger.debug(`${D_PREFIX}[${rowId}]: ${text}`);
}

function info(text: string) {
  logger.info(`${D_PREFIX}: ${text}`);
}
