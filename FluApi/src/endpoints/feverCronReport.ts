// Copyright (c) 2019 by Audere
//
// Use of this source code is governed by an MIT-style license that
// can be found in the LICENSE file distributed with this file.

import { FollowUpSurveys } from "../services/fever/followUpSurveys";
import { FollowUpDataAccess } from "../services/fever/followUpData";
import { Incentives } from "../services/fever/incentiveRecipients";
import { IncentiveRecipientsDataAccess } from "../services/fever/incentiveRecipientsData";
import { KitOrders } from "../services/fever/kitOrders";
import { KitRecipientsDataAccess } from "../services/fever/kitOrdersData";
import { ReceivedKits } from "../services/fever/receivedKits";
import { ReceivedKitsData } from "../services/fever/receivedKitsData";
import { REDCapClient } from "../external/redCapClient";
import { createAxios } from "../util/axios";
import { createGeocoder } from "../util/geocoder";
import { LazyAsync } from "../util/lazyAsync";
import { getREDCapConfig } from "../util/redCapConfig";
import { SecretConfig } from "../util/secretsConfig";
import { getS3Config, S3Config } from "../util/s3Config";
import { SplitSql } from "../util/sql";
import { defineFeverModels } from "../models/db/fever";
import { defineGaplessSeq } from "../models/db/gaplessSeq";
import { S3Uploader } from "../external/s3Uploader";
import * as AWS from "aws-sdk";

export class FeverCronReportEndpoint {
  private incentives: LazyAsync<Incentives>;
  private kits: LazyAsync<KitOrders>;
  private followUps: LazyAsync<FollowUpSurveys>;
  private receivedKits: LazyAsync<ReceivedKits>;

  constructor(sql: SplitSql) {
    const secrets = new SecretConfig(sql);
    const s3 = new LazyAsync(() => getS3Config(secrets));
    this.incentives = new LazyAsync(() => createIncentives(sql, s3));
    this.kits = new LazyAsync(() => createKits(sql, secrets, s3));
    this.followUps = new LazyAsync(() => createFollowUps(sql, secrets, s3));
    this.receivedKits =
      new LazyAsync(() => createReceivedKits(sql, secrets, s3));
  }

  async exportBarcodes(req, res, next) {
    try {
      const service = await this.receivedKits.get();
      await service.exportBarcodes();
      res.sendStatus(200);
    } catch (e) {
      next(e);
    }
  }

  async importReceivedKits(req, res, next) {
    try {
      const service = await this.receivedKits.get();
      await service.importReceivedKits();
      res.sendStatus(200);
    } catch (e) {
      next(e);
    }
  }

  async importFollowUpSurveys(req, res, next) {
    try {
      const service = await this.followUps.get();
      await service.importFollowUpResults();
      res.sendStatus(200);
    } catch (e) {
      next(e);
    }
  }

  async sendIncentives(req, res, next) {
    try {
      const service = await this.incentives.get();
      await service.generateReport();
      res.sendStatus(200);
    } catch (e) {
      next(e);
    }
  }

  async sendKitOrders(req, res, next) {
    try {
      const service = await this.kits.get();
      await service.generateReport();
      res.sendStatus(200);
    } catch (e) {
      next(e);
    }
  }

  async sendSurveys(req, res, next) {
    try {
      const service = await this.followUps.get();
      await service.generateReport();
      res.sendStatus(200);
    } catch (e) {
      next(e);
    }
  }
}

async function createIncentives(
  sql: SplitSql,
  s3Config: LazyAsync<S3Config>
): Promise<Incentives> {
  const fever = defineFeverModels(sql);
  const seq = defineGaplessSeq(sql);
  const dao = new IncentiveRecipientsDataAccess(
    sql,
    seq,
    fever.incentiveBatch,
    fever.incentiveItem,
    fever.incentiveDiscard
  );
  const s3 = new AWS.S3({ region: "us-west-2" });
  const uploader = new S3Uploader(s3, await s3Config.get());
  return new Incentives(dao, uploader);
}

async function createKits(
  sql: SplitSql,
  secrets: SecretConfig,
  s3Config: LazyAsync<S3Config>
): Promise<KitOrders> {
  const fever = defineFeverModels(sql);
  const seq = defineGaplessSeq(sql);
  const dao = new KitRecipientsDataAccess(
    sql,
    seq,
    fever.kitBatch,
    fever.kitItem,
    fever.kitDiscard
  );
  const geocoder = await createGeocoder(secrets, sql);
  const s3 = new AWS.S3({ region: "us-west-2" });
  const uploader = new S3Uploader(s3, await s3Config.get());
  return new KitOrders(dao, geocoder, uploader);
}

async function createFollowUps(
  sql: SplitSql,
  secrets: SecretConfig,
  s3Config: LazyAsync<S3Config>
): Promise<FollowUpSurveys> {
  const fever = defineFeverModels(sql);
  const seq = defineGaplessSeq(sql);
  const dao = new FollowUpDataAccess(
    sql,
    seq,
    fever.followUpBatch,
    fever.followUpItem,
    fever.followUpDiscard
  );
  const s3 = new AWS.S3({ region: "us-west-2" });
  const uploader = new S3Uploader(s3, await s3Config.get());
  const redCapConfig = await getREDCapConfig(secrets);
  const axios = createAxios(redCapConfig.apiUrl);
  const retriever = new REDCapClient(axios, redCapConfig);
  return new FollowUpSurveys(dao, uploader, retriever);
}

async function createReceivedKits(
  sql: SplitSql,
  secrets: SecretConfig,
  s3Config: LazyAsync<S3Config>
): Promise<ReceivedKits> {
  const dao = new ReceivedKitsData(sql);
  const redCapConfig = await getREDCapConfig(secrets);
  const axios = createAxios(redCapConfig.apiUrl);
  const retriever = new REDCapClient(axios, redCapConfig);
  const s3 = new AWS.S3({ region: "us-west-2" });
  const uploader = new S3Uploader(s3, await s3Config.get());
  return new ReceivedKits(dao, retriever, uploader);
}
