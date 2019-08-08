// Copyright (c) 2019 by Audere
//
// Use of this source code is governed by an MIT-style license that
// can be found in the LICENSE file distributed with this file.

import winston, { createLogger, format } from "winston";

const FORMAT_WITH_TIMESTAMP = format.printf(
  ({ level, message, timestamp }) =>
    `[${timestamp || new Date().toISOString()}] ${level} ${message.trim()}`
);

const LOGGER_OPTIONS = {
  level: "debug",
  format: FORMAT_WITH_TIMESTAMP,
};

const logger = createLogger({
  transports: [new winston.transports.Console(LOGGER_OPTIONS)],
});

export default logger;
