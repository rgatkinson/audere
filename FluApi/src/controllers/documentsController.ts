import winston, { createLogger } from "winston";
import {
  DocumentType,
  VisitDocument,
  FeedbackDocument,
  LogDocument
} from "audere-lib";
import { AccessKey } from "../models/accessKey";
import { Visit } from "../models/visit";
import logger from "../util/logger";

const clientLogger = createLogger({
  transports: [
    new winston.transports.File({ filename: "clients.log", level: "debug" })
  ]
});

export async function putDocument(req, res) {
  switch (req.body.documentType) {
    case DocumentType.Visit:
      const visit = req.body as VisitDocument;
      await Visit.upsert({
        csruid: req.params.documentId,
        device: visit.device,
        visit: visit.visit
      });
      break;
    case DocumentType.Feedback:
      const feedback = req.body as FeedbackDocument;
      // TODO(ram): send an email
      logger.info(JSON.stringify(feedback));
      break;
    case DocumentType.Log:
      const log = req.body as LogDocument;
      clientLogger.info(JSON.stringify(log));
      break;
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
    next();
    logger.warn(`Rejected document upload with key: ${req.params.key}`);
    return;
  }
  try {
    return await putDocument(req, res);
  } catch (e) {
    next(e);
  }
}
