// Copyright (c) 2019 by Audere
//
// Use of this source code is governed by an MIT-style license that
// can be found in the LICENSE file distributed with this file.

import { createGeocoder } from "../util/geocoder";
import { getSharePointConfig } from "../util/sharePointConfig";
import { Incentives } from "../services/feverApi/incentives";
import { IncentiveRecipients, IncentiveRecipientsDataAccess } from "../services/feverApi/incentiveRecipients";
import { SecretConfig } from "../util/secretsConfig";
import { SharePointUploader } from "../services/feverApi/sharePointUploader";
import { SplitSql } from "../util/sql";

export class FeverIncentivesEndpoint {
  // Alternatively the "Promise of Incentives".
  private incentivesPromise: Promise<Incentives>;
  private readonly sql: SplitSql;

  constructor(sql: SplitSql) {
    this.sql = sql;
  }

  private lazyIncentives(): Promise<Incentives> {
    const existing = this.incentivesPromise;
    if (existing != null) {
      return existing;
    }

    const created = createIncentives(this.sql);
    this.incentivesPromise = created;
    return created;
  }

  async sendIncentives(req, res, next) {
    try {
      const service = await this.lazyIncentives();
      return await service.sendIncentives();
    } catch (e) {
      next(e);
    }
  }
}

async function createIncentives(sql: SplitSql): Promise<Incentives> {
  const geocoder = await createGeocoder(sql);

  const dao = new IncentiveRecipientsDataAccess(sql);
  const recipients = new IncentiveRecipients(dao);

  const secrets = new SecretConfig(sql);
  const sharePointConfig = await getSharePointConfig(secrets);
  const uploader = new SharePointUploader(sharePointConfig);

  return new Incentives(recipients, geocoder, uploader);
}