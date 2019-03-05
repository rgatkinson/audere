// Copyright (c) 2018 by Audere
//
// Use of this source code is governed by an MIT-style license that
// can be found in the LICENSE file distributed with this file.

import winston, { createLogger } from "winston";
import WinstonCloudWatch from "winston-cloudwatch";
import { isAWS } from "./environment";

const LOGGER_OPTIONS = isAWS()
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

if (!isAWS()) {
  logger.debug("Logging initialized at debug level");
} else {
  const env = process.env.NODE_ENV.toLowerCase();

  // AWS resources such as the log group name use prod instead of production.
  const awsEnv = env === "production" ? "prod" : env;
  logger.add(
    new WinstonCloudWatch({
      logGroupName: "flu-" + awsEnv + "-api",
      logStreamName: "flu-api-instance",
      awsRegion: "us-west-2"
    })
  );
}

export default logger;
