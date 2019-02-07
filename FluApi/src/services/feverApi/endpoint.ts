// Copyright (c) 2019 by Audere
//
// Use of this source code is governed by an MIT-style license that
// can be found in the LICENSE file distributed with this file.

import winston, { createLogger } from "winston";
import {
  DocumentType,
  FeedbackDocument,
  LogDocument,
  SurveyDocument,
  SurveyNonPIIDbInfo,
  PIIInfo,
  CommonInfo,
  ConsentInfo,
  NonPIIConsentInfo,
  ResponseInfo,
  ResponseItemInfo,
  LogBatchDocument
} from "audere-lib/feverProtocol";
import { AccessKey, ClientLog, ClientLogBatch, Feedback, SurveyNonPII, SurveyPII } from "./models";
import { sendEmail } from "../../util/email";
import logger from "../../util/logger";

const clientLogger = createLogger({
  transports: [
    new winston.transports.File({ filename: "fever-clients.log", level: "debug" })
  ]
});

const FEEDBACK_EMAIL = "feedback@auderenow.org";
const FEEDBACK_SENDER_EMAIL = "app@auderenow.org";

export async function putDocument(req, res) {
  switch (req.body.documentType) {
    case DocumentType.Survey: {
      const csruid = req.params.documentId;
      const document = req.body as SurveyDocument;
      const device = document.device;
      const { isDemo, events, workflow, responses, consents, patient, samples } = document.survey;

      const common: CommonInfo = { isDemo, events, workflow };
      const surveyNonPII: SurveyNonPIIDbInfo = {
        ...common,
        consents: deIdentifyConsents(consents),
        samples,
        responses: responses.map(filterResponsePII(false)),
      };
      const surveyPII: PIIInfo = {
        ...common,
        patient,
        consents,
        responses: responses.map(filterResponsePII(true)),
      }

      await Promise.all([
        SurveyNonPII.upsert({ csruid, device, survey: surveyNonPII }),
        SurveyPII.upsert({ csruid, device, survey: surveyPII }),
      ]);
      break;
    }

    case DocumentType.Feedback:
      const feedbackDocument = req.body as FeedbackDocument;
      await sendEmail({
        subject: `[In-App Feedback] ${feedbackDocument.feedback.subject}`,
        body:
          feedbackDocument.feedback.body +
          "\n\n" +
          JSON.stringify(feedbackDocument.device, null, 2),
        to: [FEEDBACK_EMAIL],
        from: FEEDBACK_SENDER_EMAIL,
        replyTo: FEEDBACK_EMAIL
      });
      await Feedback.create({
        subject: feedbackDocument.feedback.subject,
        body: feedbackDocument.feedback.body,
        device: feedbackDocument.device
      });
      break;

    case DocumentType.Log: {
      const document = req.body as LogDocument;
      const log = document.log;
      clientLogger.info(JSON.stringify(log));
      await ClientLog.create({
        log: log.logentry,
        level: log.level,
        device: document.device
      });
      break;
    }

    case DocumentType.LogBatch: {
      const doc = req.body as LogBatchDocument;
      const csruid = doc.csruid;
      const device = doc.device;
      const batch = doc.batch;
      await ClientLogBatch.upsert({ csruid, device, batch });
      break;
    }

    default:
      throw new Error("Invalid document type");
  }
  res.json({ Status: "SUCCESS" });
}

export async function putDocumentWithKey(req, res, next) {
  const matchingKey = await AccessKey.findOne({
    where: { key: req.params.key, valid: true }
  });

  if (!matchingKey) {
    logger.warn(`Rejected document upload with key: ${req.params.key}`);
    next();
    return;
  }
  try {
    return await putDocument(req, res);
  } catch (e) {
    next(e);
  }
}

function deIdentifyConsents(consents?: ConsentInfo[]): NonPIIConsentInfo[] {
  return consents == null ? [] : consents.map(deIdentifyConsent);
}

function deIdentifyConsent(consent: ConsentInfo): NonPIIConsentInfo {
  return {
    terms: consent.terms,
    signerType: consent.signerType,
    date: consent.date,
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
