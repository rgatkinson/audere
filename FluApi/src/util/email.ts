// Copyright (c) 2018, 2019 by Audere
//
// Use of this source code is governed by an MIT-style license that
// can be found in the LICENSE file distributed with this file.

import { AWS } from "./aws";
import logger from "./logger";
import { isAWS } from "./environment";

const SESClient = new AWS.SES({ apiVersion: "2010-12-01" });

export type Email = {
  subject: string;
  body: string;
  to: string[];
  from: string;
  replyTo?: string;
};

export class Emailer {
  public send(email: Email): Promise<void> {
    return sendEmail(email);
  }
}

export async function sendEmail({ subject, body, to, from, replyTo }: Email) {
  if (!isAWS() && !process.env.SEND_EMAIL) {
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
