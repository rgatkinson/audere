import { AWS } from "./aws";
import logger from "./logger";

const SESClient = new AWS.SES({ apiVersion: "2010-12-01" });

type sendEmailParams = {
  subject: string;
  body: string;
  to: string[];
  from: string;
  replyTo?: string;
};
export async function sendEmail({
  subject,
  body,
  to,
  from,
  replyTo
}: sendEmailParams) {
  if (process.env.NODE_ENV !== "production" && !process.env.SEND_EMAIL) {
    logger.debug(
      `Skipped sending email from ${from} to ${to.join(", ")}:` +
        `${subject}\nBEGIN EMAIL BODY\n${body}\nEND EMAIL BODY`
    );
    return;
  }
  const emailParams = {
    Destination: {
      ToAddresses: to
    },
    Source: from,
    Message: {
      Body: {
        Text: {
          Charset: "UTF-8",
          Data: body
        }
      },
      Subject: {
        Charset: "UTF-8",
        Data: subject
      }
    }
  };
  if (replyTo) {
    emailParams["ReplyToAddresses"] = [replyTo];
  }
  const result = await SESClient.sendEmail(emailParams).promise();
  logger.info(`Sent email: ${JSON.stringify(result)}`);
}
