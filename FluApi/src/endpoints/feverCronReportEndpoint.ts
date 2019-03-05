// Copyright (c) 2019 by Audere
//
// Use of this source code is governed by an MIT-style license that
// can be found in the LICENSE file distributed with this file.

import { Incentives, IncentiveRecipientsDataAccess } from "../services/feverApi/incentiveRecipients";
import { KitOrders, KitRecipientsDataAccess } from "../services/feverApi/kitOrders";
import { createGeocoder } from "../util/geocoder";
import { LazyAsync } from "../util/lazyAsync";
import { SecretConfig } from "../util/secretsConfig";
import { getS3Config } from "../util/s3Config";
import { SplitSql } from "../util/sql";
import { S3Uploader } from "../services/feverApi/s3Uploader";
import * as AWS from "aws-sdk";

export class FeverCronReportEndpoint {
  private readonly sql: SplitSql;
  private incentives: LazyAsync<Incentives>;
  private kits: LazyAsync<KitOrders>;

  constructor(sql: SplitSql) {
    this.sql = sql;
    this.incentives = new LazyAsync(() => createIncentives(sql));
    this.kits = new LazyAsync(() => createKits(sql));
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
}

async function createIncentives(sql: SplitSql): Promise<Incentives> {
  const geocoder = await createGeocoder(sql);
  const dao = new IncentiveRecipientsDataAccess(sql);
  const secrets = new SecretConfig(sql);
  const s3Config = await getS3Config(secrets);
  const s3 = new AWS.S3({ region: "us-west-2" });
  const uploader = new S3Uploader(s3, s3Config);
  return new Incentives(dao, geocoder, uploader);
}

async function createKits(sql: SplitSql): Promise<KitOrders> {
  const geocoder = await createGeocoder(sql);
  const dao = new KitRecipientsDataAccess(sql);
  const secrets = new SecretConfig(sql);
  const s3Config = await getS3Config(secrets);
  const s3 = new AWS.S3({ region: "us-west-2" });
  const uploader = new S3Uploader(s3, s3Config);
  return new KitOrders(dao, geocoder, uploader);
}