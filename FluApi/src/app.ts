// Copyright (c) 2018 by Audere
//
// Use of this source code is governed by an MIT-style license that
// can be found in the LICENSE file distributed with this file.

import express from "express";
import Ouch from "ouch";
import bodyParser from "body-parser";
import helmet from "helmet";
import { promises as fs } from "fs";
import * as VisitsController from "./controllers/visitsController";
import { ButtonPush } from "./models/buttonPush";
import { ValidationError } from "sequelize";
import { sequelize } from "./models";
import { generateRandomKey } from "./util/crypto";
import logger from "./util/logger";

sequelize.authenticate();
const app = express();
const buildInfo = require("../static/buildInfo.json");

app.set("port", process.env.PORT || 3000);
app.use(helmet());
app.use(bodyParser.json());

app.get("/", (req, res) => {
  res.send("OK");
});

app.get("/boom", (req, res) => {
  throw new Error("Boom!");
});

app.get(
  "/async-boom",
  wrap(async (req, res) => {
    throw new Error("Async Boom!");
  })
);

app.get("/api", (req, res) => {
  res.json({
    // TODO: Generate the token using `csrf` npm module
    // Do we need CSRF for JSON API?
    CsrfToken: null,
    Status: "SUCCESS"
  });
});

app.post(
  "/api/button",
  wrap(async (req, res) => {
    try {
      await ButtonPush.create({
        deviceId: req.body.DeviceId,
        timestamp: req.body.Timestamp,
        count: req.body.Count,
        extra: req.body.Extra
      });
      res.json({ Status: "SUCCESS" });
    } catch (error) {
      if (error instanceof ValidationError) {
        res.status(400).json({ Status: error.message });
      } else {
        console.error(error);
        throw error;
      }
    }
  })
);

app.put(
  "/api/documents/:key([A-Za-z0-9-_]{0,})/:documentId([A-Za-z0-9-_]{0,})",
  VisitsController.putDocumentWithKey
);

app.put(
  "/api/documents/:documentId([A-Za-z0-9-_]{0,})",
  wrap(VisitsController.putDocument)
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
  logger.error(err);
  const ouch = new Ouch();
  ouch.pushHandler(new Ouch.handlers.PrettyPageHandler("orange", null));
  ouch.handleException(err, req, res);
});

export default app;
