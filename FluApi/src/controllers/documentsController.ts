import winston, { createLogger } from "winston";
import { DocumentType } from "audere-lib";
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
      await Visit.upsert({
        csruid: req.params.documentId,
        device: req.body.device,
        visit: req.body.document
      });
      break;
    case DocumentType.Feedback:
      // TODO(ram): send an email
      logger.info(JSON.stringify(req.body));
      break;
    case DocumentType.Log:
      clientLogger.info(JSON.stringify(req.body));
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
