// Copyright (c) 2019 by Audere
//
// Use of this source code is governed by an MIT-style license that
// can be found in the LICENSE file distributed with this file.

import { Incentives, IncentiveRecipientsDataAccess } from "../services/feverApi/incentiveRecipients";
import { KitOrders, KitRecipientsDataAccess } from "../services/feverApi/kitOrders";
import { SharePointUploader } from "../services/feverApi/sharePointUploader";
import { createGeocoder } from "../util/geocoder";
import { LazyAsync } from "../util/lazyAsync";
import { SecretConfig } from "../util/secretsConfig";
import { getSharePointConfig } from "../util/sharePointConfig";
import { SplitSql } from "../util/sql";

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
      return await service.generateReport();
    } catch (e) {
      next(e);
    }
  }

  async sendKitOrders(req, res, next) {
    try {
      const service = await this.kits.get();
      return await service.generateReport();
    } catch (e) {
      next(e);
    }
  }
}

async function createIncentives(sql: SplitSql): Promise<Incentives> {
  const geocoder = await createGeocoder(sql);
  const dao = new IncentiveRecipientsDataAccess(sql);
  const secrets = new SecretConfig(sql);
  const sharePointConfig = await getSharePointConfig(secrets);
  const uploader = new SharePointUploader(sharePointConfig);
  return new Incentives(dao, geocoder, uploader);
}

async function createKits(sql: SplitSql): Promise<KitOrders> {
  const geocoder = await createGeocoder(sql);
  const dao = new KitRecipientsDataAccess(sql);
  const secrets = new SecretConfig(sql);
  const sharePointConfig = await getSharePointConfig(secrets);
  const uploader = new SharePointUploader(sharePointConfig);
  return new KitOrders(dao, geocoder, uploader);
}