import winston, { createLogger } from "winston";

const PRODUCTION = process.env.NODE_ENV === "production";
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

if (process.env.NODE_ENV !== "production") {
  logger.debug("Logging initialized at debug level");
}

export default logger;
