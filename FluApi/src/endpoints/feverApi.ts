// Copyright (c) 2019 by Audere
//
// Use of this source code is governed by an MIT-style license that
// can be found in the LICENSE file distributed with this file.

import winston, { createLogger } from "winston";
import {
  DocumentType,
  FeedbackDocument,
  SurveyDocument,
  SurveyNonPIIDbInfo,
  PIIInfo,
  CommonInfo,
  ConsentInfo,
  NonPIIConsentInfo,
  ResponseInfo,
  ResponseItemInfo,
  AnalyticsDocument,
  PhotoDocument
} from "audere-lib/feverProtocol";
import { defineFeverModels, FeverModels } from "../models/db/fever";
import { sendEmail } from "../util/email";
import logger from "../util/logger";
import { SplitSql } from "../util/sql";

const clientLogger = createLogger({
  transports: [
    new winston.transports.File({
      filename: "fever-clients.log",
      level: "debug"
    })
  ]
});

const FEEDBACK_EMAIL = "feedback@auderenow.org";
const FEEDBACK_SENDER_EMAIL = "app@auderenow.org";

export class FeverEndpoint {
  private readonly models: FeverModels;

  constructor(sql: SplitSql) {
    this.models = defineFeverModels(sql);
  }

  async putFeverDocument(req, res, next) {
    const query = { where: { key: req.params.key, valid: true } };
    if (!(await this.models.accessKey.findOne(query))) {
      logger.warn(`Rejected document upload with key: ${req.params.key}`);
      next();
      return;
    }
    try {
      return await this.putDocument(req, res);
    } catch (e) {
      next(e);
    }
  }

  async putDocument(req, res) {
    switch (req.body.documentType) {
      case DocumentType.Survey:
        await this.putSurvey(req.body as SurveyDocument);
        break;
      case DocumentType.Feedback:
        await this.sendAndPutFeedback(req.body as FeedbackDocument);
        break;
      case DocumentType.Analytics:
        await this.putAnalytics(req.body as AnalyticsDocument);
        break;
      case DocumentType.Photo:
        await this.putPhoto(req.body as PhotoDocument);
        break;
      default:
        throw new Error("Invalid document type");
    }
    res.json({ Status: "SUCCESS" });
  }

  async putSurvey(document: SurveyDocument): Promise<void> {
    const { csruid, device } = document;
    const {
      isDemo,
      events,
      workflow,
      responses,
      consents,
      patient,
      samples
    } = document.survey;

    const common: CommonInfo = { isDemo, events, workflow };
    const surveyNonPII: SurveyNonPIIDbInfo = {
      ...common,
      consents: deIdentifyConsents(consents),
      samples,
      responses: responses.map(filterResponsePII(false))
    };
    const surveyPII: PIIInfo = {
      ...common,
      patient,
      consents,
      responses: responses.map(filterResponsePII(true))
    };

    await Promise.all([
      this.models.surveyNonPii.upsert({ csruid, device, survey: surveyNonPII }),
      this.models.surveyPii.upsert({ csruid, device, survey: surveyPII })
    ]);
  }

  async sendAndPutFeedback(document: FeedbackDocument): Promise<void> {
    await sendEmail({
      subject: `[In-App Feedback] ${document.feedback.subject}`,
      text:
        document.feedback.body +
        "\n\n" +
        JSON.stringify(document.device, null, 2),
      to: [FEEDBACK_EMAIL],
      from: FEEDBACK_SENDER_EMAIL,
      replyTo: FEEDBACK_EMAIL
    });
    await this.models.feedback.create({
      subject: document.feedback.subject,
      body: document.feedback.body,
      device: document.device
    });
  }

  async putAnalytics(document: AnalyticsDocument): Promise<void> {
    const { csruid, device, analytics } = document;
    await this.models.clientLogBatch.upsert({ csruid, device, analytics });
  }

  async putPhoto(document: PhotoDocument): Promise<void> {
    const { csruid, device, photo } = document;
    await this.models.photo.upsert({ csruid, device, photo });
  }
}

function deIdentifyConsents(consents?: ConsentInfo[]): NonPIIConsentInfo[] {
  return consents == null ? [] : consents.map(deIdentifyConsent);
}

function deIdentifyConsent(consent: ConsentInfo): NonPIIConsentInfo {
  return {
    terms: consent.terms,
    signerType: consent.signerType,
    date: consent.date
  };
}

const PII_RESPONSE_KEYS = new Set([
  "Address",
  "AddressCampus",
  "AddressOtherShelter",
  "AddressCountryResidence",
  "AddressNextWeek",
  "BedAssignment",
  "BirthDate",
  "WorkAddress"
]);

function filterResponsePII(allowPII: boolean) {
  function matchResponseItem(item: ResponseItemInfo): boolean {
    return PII_RESPONSE_KEYS.has(item.id) === allowPII;
  }

  function mapResponse(response: ResponseInfo): ResponseInfo {
    return {
      id: response.id,
      item: (response.item || []).filter(matchResponseItem)
    };
  }

  return mapResponse;
}
