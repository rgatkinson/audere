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
import { S3Retriever } from "../external/s3Retriever";
import { createGeocoder } from "../util/geocoder";
import { LazyAsync } from "../util/lazyAsync";
import { SecretConfig } from "../util/secretsConfig";
import { getS3Config } from "../util/s3Config";
import { SplitSql } from "../util/sql";
import { defineFeverModels } from "../models/db/fever";
import { defineGaplessSeq } from "../models/db/gaplessSeq";
import { S3Uploader } from "../external/s3Uploader";
import * as AWS from "aws-sdk";

export class FeverCronReportEndpoint {
  private readonly sql: SplitSql;
  private incentives: LazyAsync<Incentives>;
  private kits: LazyAsync<KitOrders>;
  private followUps: LazyAsync<FollowUpSurveys>;
  private receivedKits: LazyAsync<ReceivedKits>;

  constructor(sql: SplitSql) {
    this.sql = sql;
    this.incentives = new LazyAsync(() => createIncentives(sql));
    this.kits = new LazyAsync(() => createKits(sql));
    this.followUps = new LazyAsync(() => createFollowUps(sql));
    this.receivedKits = new LazyAsync(() => createReceivedKits(sql));
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

  async importReceivedKits(req, res, next) {
    try {
      const service = await this.receivedKits.get();
      await service.importReceivedKits();
      res.sendStatus(200);
    } catch (e) {
      next(e);
    }
  }
}

async function createIncentives(sql: SplitSql): Promise<Incentives> {
  const fever = defineFeverModels(sql);
  const seq = defineGaplessSeq(sql);
  const dao = new IncentiveRecipientsDataAccess(
    sql,
    seq,
    fever.incentiveBatch,
    fever.incentiveItem,
    fever.incentiveDiscard);
  const secrets = new SecretConfig(sql);
  const s3Config = await getS3Config(secrets);
  const s3 = new AWS.S3({ region: "us-west-2" });
  const uploader = new S3Uploader(s3, s3Config);
  return new Incentives(dao, uploader);
}

async function createKits(sql: SplitSql): Promise<KitOrders> {
  const fever = defineFeverModels(sql);
  const seq = defineGaplessSeq(sql);
  const dao = new KitRecipientsDataAccess(
    sql,
    seq,
    fever.kitBatch,
    fever.kitItem,
    fever.kitDiscard);
  const secrets = new SecretConfig(sql);
  const geocoder = await createGeocoder(secrets, sql);
  const s3Config = await getS3Config(secrets);
  const s3 = new AWS.S3({ region: "us-west-2" });
  const uploader = new S3Uploader(s3, s3Config);
  return new KitOrders(dao, geocoder, uploader);
}

async function createFollowUps(sql: SplitSql): Promise<FollowUpSurveys> {
  const fever = defineFeverModels(sql);
  const seq = defineGaplessSeq(sql);
  const dao = new FollowUpDataAccess(
    sql,
    seq,
    fever.followUpBatch,
    fever.followUpItem,
    fever.followUpDiscard);
  const secrets = new SecretConfig(sql);
  const s3Config = await getS3Config(secrets);
  const s3 = new AWS.S3({ region: "us-west-2" });
  const uploader = new S3Uploader(s3, s3Config);
  return new FollowUpSurveys(dao, uploader);
}

async function createReceivedKits(sql: SplitSql): Promise<ReceivedKits> {
  const dao = new ReceivedKitsData(sql);
  const secrets = new SecretConfig(sql);
  const s3Config = await getS3Config(secrets);
  const s3 = new AWS.S3({ region: "us-west-2" });
  const retriever = new S3Retriever(s3, s3Config);
  const uploader = new S3Uploader(s3, s3Config);
  return new ReceivedKits(dao, retriever, uploader);
}
