// Copyright (c) 2018 by Audere
//
// Use of this source code is governed by an MIT-style license that
// can be found in the LICENSE file distributed with this file.

import winston, { createLogger, format } from "winston";
import { isAWS } from "./environment";

const FORMAT_WITH_TIMESTAMP = format.printf(
  ({ level, message, timestamp }) =>
    `[${timestamp || new Date().toISOString()}] ${level} ${message.trim()}`
);

const LOGGER_OPTIONS = isAWS()
  ? {
      level: "error",
      format: FORMAT_WITH_TIMESTAMP,
    }
  : {
      level: "debug",
      format: FORMAT_WITH_TIMESTAMP,
    };

const transports = [];
transports.push(new winston.transports.Console(LOGGER_OPTIONS));

if (!isAWS()) {
  transports.push(
    new winston.transports.File({
      filename: "debug.log",
      level: "debug",
      format: FORMAT_WITH_TIMESTAMP,
    })
  );
}

const logger = createLogger({ transports: transports });

export default logger;
