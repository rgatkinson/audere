// Copyright (c) 2018, 2019 by Audere
//
// Use of this source code is governed by an MIT-style license that
// can be found in the LICENSE file distributed with this file.

import nodemailer, { SendMailOptions } from "nodemailer";
import { AWS } from "./aws";
import logger from "./logger";
import { isAWS } from "./environment";
import { LazyAsync } from "./lazyAsync";

const SHOULD_SEND_EMAIL = isAWS() || process.env.SEND_EMAIL;

const SESClient = new AWS.SES({ apiVersion: "2010-12-01" });
const SESNodemailerTransport = nodemailer.createTransport({
  SES: SESClient,
});

const testNodemailerTransport = new LazyAsync(getTestNodeMailer);

async function getNodemailerTransport() {
  if (!SHOULD_SEND_EMAIL) {
    return await testNodemailerTransport.get();
  }
  return SESNodemailerTransport;
}

async function getTestNodeMailer() {
  const account = await nodemailer.createTestAccount();
  const testTransport = nodemailer.createTransport({
    host: "smtp.ethereal.email",
    port: 587,
    secure: false,
    auth: account,
  });
  return {
    sendMail(config: SendMailOptions) {
      const to = Array.isArray(config.to) ? config.to.join(",") : config.to;
      logger.debug(
        `Sending test email from ${config.from} to ${to}:` +
          `${config.subject}\nBEGIN EMAIL BODY\n${config.text ||
            config.html}\nEND EMAIL BODY`
      );
      return testTransport.sendMail(config);
    },
  };
}

export class Emailer {
  public send(email: SendMailOptions): Promise<void> {
    return sendEmail(email);
  }
}

export async function sendEmail(params: SendMailOptions) {
  const transport = await getNodemailerTransport();
  const result = await transport.sendMail(params);
  logger.info("Email sent via nodemailer: " + result.messageId);
  if (!SHOULD_SEND_EMAIL) {
    logger.debug("Preview URL: " + nodemailer.getTestMessageUrl(result));
  }
}
