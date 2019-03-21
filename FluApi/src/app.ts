// Copyright (c) 2018, 2019 by Audere
//
// Use of this source code is governed by an MIT-style license that
// can be found in the LICENSE file distributed with this file.

import { resolve } from "path";
import bodyParser from "body-parser";
import base64url from "base64url";
import { SnifflesEndpoint } from "./endpoints/snifflesApi";
import { ConsentEmailerEndpoint } from "./endpoints/snifflesConsentMailer";
import { HutchUploaderEndpoint } from "./endpoints/hutchUpload";
import { FeverEndpoint } from "./endpoints/feverApi";
import { generateRandomKey, generateRandomBytes } from "./util/crypto";
import { SplitSql } from "./util/sql";
import { FeverCronReportEndpoint } from "./endpoints/feverCronReport";
import { FeverConsentEmailerEndpoint } from "./endpoints/feverConsentMailer";
import { FeverValidateAddress } from "./endpoints/feverValidateAddress";
import { useOuch, createApp, wrap } from "./util/expressApp";
import { PortalConfig, portalApp } from "./endpoints/webPortal/endpoint";

const buildInfo = require("../static/buildInfo.json");

export interface AppConfig extends PortalConfig {
  sql: SplitSql;
  consentEmailer?: FeverConsentEmailerEndpoint;
}

export async function createPublicApp(config: AppConfig) {
  const sql = config.sql;

  // Public app is internet-facing.
  const publicApp = createApp();
  publicApp.set("port", process.env.PORT || 3000);
  publicApp.use(bodyParser.json({ limit: "20mb" }));

  publicApp.get("/favicon.ico", async (req, res) =>
    res.sendFile(resolve(__dirname, "endpoints/webPortal/static/favicon.ico"))
  );
  publicApp.use("/portal", await portalApp(config));

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

  const feverAddress = new FeverValidateAddress(sql);

  publicApp.get(
    "/api/validateAddress",
    wrap(async (req, res) => {
      const results = await feverAddress.performRequest(req);
      res.json(results);
    })
  );

  return useOuch(publicApp);
}

export function createInternalApp(config: AppConfig) {
  const sql = config.sql;

  // Internal app should be intranet only.
  const internalApp = createApp();
  internalApp.set("port", process.env.INTERNAL_PORT || 3200);
  internalApp.use(bodyParser.json());

  internalApp.get("/api", (req, res) => res.json({ Status: "OK" }));

  const hutchUploader = new HutchUploaderEndpoint(sql);
  const snifflesConsentEmailer = new ConsentEmailerEndpoint(sql);
  internalApp.get("/api/export/getEncounters", (req, res, next) =>
    hutchUploader.getEncounters(req, res, next)
  );

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

  const feverConsentEmailer =
    config.consentEmailer || new FeverConsentEmailerEndpoint(sql);
  // TODO: remove after migrating lambda to sendFeverConsentEmails
  internalApp.get("/api/sendConsentEmails", feverConsentEmailer.handleGet);
  internalApp.get("/api/sendFeverConsentEmails", feverConsentEmailer.handleGet);

  internalApp.get(
    "/api/sendSnifflesConsentEmails",
    snifflesConsentEmailer.sendConsentEmails
  );

  return useOuch(internalApp);
}
