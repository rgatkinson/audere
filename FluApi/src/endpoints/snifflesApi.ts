// Copyright (c) 2018, 2019 by Audere
//
// Use of this source code is governed by an MIT-style license that
// can be found in the LICENSE file distributed with this file.

import winston, { createLogger } from "winston";
import {
  DocumentType,
  FeedbackDocument,
  LogDocument,
  VisitDocument,
  VisitCommonInfo,
  VisitNonPIIDbInfo,
  VisitPIIInfo,
  ConsentInfo,
  NonPIIConsentInfo,
  ResponseInfo,
  ResponseItemInfo,
  LogBatchDocument,
  ProtocolDocument
} from "audere-lib/snifflesProtocol";
import { sendEmail } from "../util/email";
import logger from "../util/logger";
import { SnifflesModels, defineSnifflesModels } from "../models/db/sniffles";
import { SplitSql } from "../util/sql";
import { filterResponsePII } from "../services/sniffles/piiFilter";
import { requestId } from "../util/expressApp";

const clientLogger = createLogger({
  transports: [
    new winston.transports.File({ filename: "clients.log", level: "debug" })
  ]
});

const FEEDBACK_EMAIL = "feedback@auderenow.org";
const FEEDBACK_SENDER_EMAIL = "app@auderenow.org";

export class SnifflesEndpoint {
  private readonly models: SnifflesModels;

  constructor(sql: SplitSql) {
    this.models = defineSnifflesModels(sql);
  }

  public async putDocumentWithKey(req, res, next) {
    const matchingKey = await this.models.accessKey.findOne({
      where: { key: req.params.key, valid: true }
    });

    if (!matchingKey) {
      logger.warn(`${requestId(req)} rejected document upload with key: ${req.params.key}`);
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
    const document = req.body as ProtocolDocument;
    logger.info(
      `${requestId(req)} put ${
        guard(() => document.documentType)
        } ${
        guard(() => document.csruid)
        } from ${
        guard(() => document.device.installation)
        } @sniffles`
    );
    switch (document.documentType) {
      case DocumentType.Visit: {
        const csruid = req.params.documentId;
        const visitDocument = document as VisitDocument;
        const responses = visitDocument.visit.responses;
        const visitCommon: VisitCommonInfo = {
          isDemo: !!visitDocument.visit.isDemo,
          complete: visitDocument.visit.complete,
          location: visitDocument.visit.location,
          administrator: visitDocument.visit.administrator,
          events: visitDocument.visit.events
        };
        const visitNonPII: VisitNonPIIDbInfo = {
          ...visitCommon,
          consents: deIdentifyConsents(visitDocument.visit.consents),
          giftcards: visitDocument.visit.giftcards,
          samples: visitDocument.visit.samples,
          responses: (responses || []).map(filterResponsePII(false))
        };
        const visitPII: VisitPIIInfo = {
          ...visitCommon,
          gps_location: visitDocument.visit.gps_location,
          patient: visitDocument.visit.patient,
          consents: visitDocument.visit.consents,
          responses: (responses || []).map(filterResponsePII(true))
        };
        await Promise.all([
          this.models.visitNonPii.upsert({
            csruid,
            device: visitDocument.device,
            visit: visitNonPII
          }),
          this.models.visitPii.upsert({
            csruid,
            device: visitDocument.device,
            visit: visitPII
          })
        ]);
        break;
      }

      case DocumentType.Feedback: {
        const feedbackDocument = document as FeedbackDocument;
        await sendEmail({
          subject: `[In-App Feedback] ${feedbackDocument.feedback.subject}`,
          text:
            feedbackDocument.feedback.body +
            "\n\n" +
            JSON.stringify(feedbackDocument.device, null, 2),
          to: [FEEDBACK_EMAIL],
          from: FEEDBACK_SENDER_EMAIL,
          replyTo: FEEDBACK_EMAIL
        });
        await this.models.feedback.create({
          subject: feedbackDocument.feedback.subject,
          body: feedbackDocument.feedback.body,
          device: feedbackDocument.device
        });
        break;
      }

      case DocumentType.Log: {
        const logDocument = document as LogDocument;
        const log = logDocument.log;
        clientLogger.info(JSON.stringify(log));
        await this.models.clientLog.create({
          log: log.logentry,
          level: log.level,
          device: logDocument.device
        });
        break;
      }

      case DocumentType.LogBatch: {
        const logBatchDocument = document as LogBatchDocument;
        const csruid = logBatchDocument.csruid;
        const device = logBatchDocument.device;
        const batch = logBatchDocument.batch;
        await this.models.clientLogBatch.upsert({ csruid, device, batch });
        break;
      }

      default:
        throw new Error("Invalid document type");
    }
    res.json({ Status: "SUCCESS" });
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
    ...(consent.relation == null ? {} : { relation: consent.relation })
  };
}

function guard(get: () => string): string {
  try {
    return get();
  } catch (err) {
    return `guard caught ${err.message}`;
  }
}
