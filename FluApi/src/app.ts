// Copyright (c) 2018 by Audere
//
// Use of this source code is governed by an MIT-style license that
// can be found in the LICENSE file distributed with this file.

import express from "express";
import Ouch from "ouch";
import bodyParser from "body-parser";
import helmet from "helmet";
import base64url from "base64url";
import * as DocumentsController from "./controllers/documentsController";
import * as ExportController from "./controllers/hutchUploadController";
import { putFeverDocument } from "./services/feverApi/endpoint";
import { sequelizeNonPII, sequelizePII } from "./models";
import { generateRandomKey, generateRandomBytes } from "./util/crypto";
import logger from "./util/logger";
import { ErrorRequestHandler } from "express-serve-static-core";

sequelizeNonPII.authenticate();
sequelizePII.authenticate();
const buildInfo = require("../static/buildInfo.json");

// Public app should be internet-facing.
export const publicApp = express();
publicApp.set("port", process.env.PORT || 3000);
publicApp.use(helmet.noCache());
publicApp.use(helmet.frameguard({ action: "deny" }));
publicApp.use(bodyParser.json({limit: '5mb'}));
publicApp.use(defaultErrorHandler(publicApp.get("env")));

publicApp.get("/api", (req, res) => res.json({ Status: "OK" }));

publicApp.put(
  "/api/documents/:key([A-Za-z0-9-_]{0,})/:documentId([A-Za-z0-9-_]{0,})",
  DocumentsController.putDocumentWithKey
);

publicApp.put(
  "/api/fever/documents/:key([A-Za-z0-9-_]{0,})/:documentId([A-Za-z0-9-_]{0,})",
  putFeverDocument
);

publicApp.get(
  "/api/documentId",
  wrap(async (req, res) => {
    res.json({ id: await generateRandomKey() });
  })
);

publicApp.get(
  "/api/randomBytes/:numBytes",
  wrap(async (req, res) => {
    res.json({
      bytes: base64url(await generateRandomBytes(parseInt(req.params.numBytes)))
    });
  })
);

publicApp.get("/about", (req, res) => {
  res.status(200).send(buildInfo);
});

function wrap(f: any) {
  return function(req, res, next) {
    f(req, res).catch(next);
  };
}

// Internal app should not be intranet only.
export const internalApp = express();
internalApp.set("port", process.env.INTERNAL_PORT || 3200);
internalApp.use(helmet.noCache());
internalApp.use(helmet.frameguard({ action: "deny" }));
internalApp.use(bodyParser.json());
internalApp.use(defaultErrorHandler(internalApp.get("env")));

internalApp.get("/api", (req, res) => res.json({ Status: "OK" }));

if (internalApp.get("env") !== "production") {
  internalApp.get("/api/export/getEncounters", ExportController.getEncounters);
}

internalApp.get("/api/export/sendEncounters", ExportController.sendEncounters);

function defaultErrorHandler(env: string): ErrorRequestHandler {
  return (err, req, res, next) => {
    if (env === "production") {
      next();
      return;
    }
    if (err) {
      logger.error("Uncaught exception:");
      logger.error(err.message);
      logger.error(err.stack);
    }
    const ouch = new Ouch();
    ouch.pushHandler(new Ouch.handlers.PrettyPageHandler("orange", null));
    ouch.handleException(err, req, res);
  };
}
