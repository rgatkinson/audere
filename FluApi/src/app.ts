// Copyright (c) 2018 by Audere
//
// Use of this source code is governed by an MIT-style license that
// can be found in the LICENSE file distributed with this file.

import express from "express";
import Ouch from "ouch";
import bodyParser from "body-parser";
import helmet from "helmet";
import base64url from "base64url";
import { SnifflesEndpoint } from "./endpoints/snifflesApi";
import { ConsentEmailerEndpoint } from "./endpoints/snifflesConsentMailer";
import { HutchUploaderEndpoint } from "./endpoints/hutchUpload/controller";
import { FeverEndpoint } from "./endpoints/feverApi";
import { generateRandomKey, generateRandomBytes } from "./util/crypto";
import logger from "./util/logger";
import { ErrorRequestHandler } from "express-serve-static-core";
import { SplitSql } from "./util/sql";
import { FeverCronReportEndpoint } from "./endpoints/feverCronReportEndpoint";
import { isAWS } from "./util/environment";
import { FeverConsentEmailerEndpoint } from "./endpoints/feverConsentMailer";

const buildInfo = require("../static/buildInfo.json");

export function createPublicApp(sql: SplitSql) {
  // Public app is internet-facing.
  const publicApp = express();
  publicApp.set("port", process.env.PORT || 3000);
  publicApp.use(helmet.noCache());
  publicApp.use(helmet.frameguard({ action: "deny" }));
  publicApp.use(bodyParser.json({ limit: "20mb" }));

  publicApp.get("/api", (req, res) => res.json({ Status: "OK" }));

  const sniffles = new SnifflesEndpoint(sql);
  publicApp.put(
    "/api/documents/:key([A-Za-z0-9-_]{0,})/:documentId([A-Za-z0-9-_]{0,})",
    (req, res, next) => sniffles.putDocumentWithKey(req, res, next)
  );

  const fever = new FeverEndpoint(sql);
  publicApp.put(
    "/api/fever/documents/:key([A-Za-z0-9-_]{0,})/:documentId([A-Za-z0-9-_]{0,})",
    (req, res, next) => fever.putFeverDocument(req, res, next)
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
        bytes: base64url(
          await generateRandomBytes(parseInt(req.params.numBytes))
        )
      });
    })
  );

  publicApp.get("/about", (req, res) => {
    res.status(200).send(buildInfo);
  });

  publicApp.use(defaultErrorHandler(publicApp.get("env")));
  return publicApp;
}

interface InternalAppEndpointOverrides {
  consentEmailer?: FeverConsentEmailerEndpoint;
}

export function createInternalApp(
  sql: SplitSql,
  overrides: InternalAppEndpointOverrides = {}
) {
  // Internal app should be intranet only.
  const internalApp = express();
  internalApp.set("port", process.env.INTERNAL_PORT || 3200);
  internalApp.use(helmet.noCache());
  internalApp.use(helmet.frameguard({ action: "deny" }));
  internalApp.use(bodyParser.json());

  internalApp.get("/api", (req, res) => res.json({ Status: "OK" }));

  const hutchUploader = new HutchUploaderEndpoint(sql);
  const snifflesConsentEmailer = new ConsentEmailerEndpoint(sql);
  if (!isAWS()) {
    internalApp.get("/api/export/getEncounters", (req, res, next) =>
      hutchUploader.getEncounters(req, res, next)
    );
  }

  internalApp.get("/api/export/sendEncounters", (req, res, next) =>
    hutchUploader.sendEncounters(req, res, next)
  );

  const fever = new FeverCronReportEndpoint(sql);
  internalApp.get("/api/export/sendIncentives", (req, res, next) =>
    fever.sendIncentives(req, res, next)
  );

  internalApp.get("/api/export/sendKitOrders", (req, res, next) =>
    fever.sendKitOrders(req, res, next)
  );

  const consentEmailer =
    overrides.consentEmailer || new FeverConsentEmailerEndpoint(sql);
  internalApp.get("/api/sendConsentEmails", consentEmailer.handleGet);
  internalApp.get(
    "/api/sendSnifflesConsentEmails",
    snifflesConsentEmailer.sendConsentEmails
  );

  internalApp.use(defaultErrorHandler(internalApp.get("env")));
  return internalApp;
}

function wrap(f: any) {
  return function(req, res, next) {
    f(req, res).catch(next);
  };
}

function defaultErrorHandler(env: string): ErrorRequestHandler {
  return (err, req, res, next) => {
    logger.error("Request terminated abnormally");
    if (err) {
      logger.error("Uncaught exception:");
      logger.error(err.message);
      logger.error(err.stack);
    }

    if (isAWS()) {
      next();
      return;
    }

    const ouch = new Ouch();
    ouch.pushHandler(new Ouch.handlers.PrettyPageHandler("orange", null));
    ouch.handleException(err, req, res);
  };
}
