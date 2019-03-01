// Copyright (c) 2018 by Audere
//
// Use of this source code is governed by an MIT-style license that
// can be found in the LICENSE file distributed with this file.

import winston, { createLogger } from "winston";
import WinstonCloudWatch from "winston-cloudwatch";
import * as AWS from "aws-sdk";

const PRODUCTION = process.env.NODE_ENV === "production";
const STAGING = process.env.NODE_ENV === "staging";
const LOGGER_OPTIONS = PRODUCTION
  ? {
      level: "error",
      format: winston.format.simple()
    }
  : {
      level: "debug",
      format: winston.format.combine(
        winston.format.colorize(),
        winston.format.simple()
      )
    };
const logger = createLogger({
  transports: [
    new winston.transports.Console(LOGGER_OPTIONS),
    new winston.transports.File({ filename: "debug.log", level: "debug" })
  ]
});

if (!PRODUCTION) {
  logger.debug("Logging initialized at debug level");
}

if (PRODUCTION || STAGING) {
  const env = process.env.NODE_ENV.toLowerCase();
  new AWS.MetadataService().request(
    "http://169.254.169.254/latest/meta-data/instance-id",
    function(err, data) {
      let streamName: string;
      if (err) {
        streamName = "flu_api_unknown_host"
      } else {
        streamName = "flu_api_" + data
      }

      logger.add(new WinstonCloudWatch({
        logGroupName: "flu_api_" + env,
        logStreamName: streamName
      }));
    }
  );
}

export default logger;
