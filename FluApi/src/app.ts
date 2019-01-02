// Copyright (c) 2018 by Audere
//
// Use of this source code is governed by an MIT-style license that
// can be found in the LICENSE file distributed with this file.

import express from "express";
import Ouch from "ouch";
import bodyParser from "body-parser";
import helmet from "helmet";
import * as DocumentsController from "./controllers/documentsController";
import { sequelizeCore, sequelizeIdentity } from "./models";
import { generateRandomKey } from "./util/crypto";
import logger from "./util/logger";

sequelizeCore.authenticate();
sequelizeIdentity.authenticate();
const app = express();
const buildInfo = require("../static/buildInfo.json");

app.set("port", process.env.PORT || 3000);
app.use(helmet.noCache());
app.use(helmet.frameguard({ action: "deny" }));
app.use(bodyParser.json());

app.get("/api", (req, res) => res.json({ Status: "OK" }));

app.put(
  "/api/documents/:key([A-Za-z0-9-_]{0,})/:documentId([A-Za-z0-9-_]{0,})",
  DocumentsController.putDocumentWithKey
);

app.put(
  "/api/documents/:documentId([A-Za-z0-9-_]{0,})",
  wrap(DocumentsController.putDocument)
);

app.get(
  "/api/documentId",
  wrap(async (req, res) => {
    res.json({ id: await generateRandomKey() });
  })
);

app.get("/about", (req, res) => {
  res.status(200).send(buildInfo);
});

function wrap(f: any) {
  return function(req, res, next) {
    f(req, res).catch(next);
  };
}

app.use((err, req, res, next) => {
  if (app.get("env") === "production") {
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
});

export default app;
