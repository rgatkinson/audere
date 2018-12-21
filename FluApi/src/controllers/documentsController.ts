import winston, { createLogger } from "winston";
import {
  DocumentType,
  VisitDocument,
  FeedbackDocument,
  LogDocument
} from "audere-lib";
import { AccessKey } from "../models/accessKey";
import { Visit } from "../models/visit";
import { Feedback } from "../models/feedback";
import { sendEmail } from "../util/email";
import logger from "../util/logger";

const clientLogger = createLogger({
  transports: [
    new winston.transports.File({ filename: "clients.log", level: "debug" })
  ]
});

const FEEDBACK_EMAIL = "feedback@auderenow.org";
const FEEDBACK_SENDER_EMAIL = "app@auderenow.org";

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
