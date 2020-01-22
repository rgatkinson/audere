// Copyright (c) 2019 by Audere
//
// Use of this source code is governed by an MIT-style license that
// can be found in the LICENSE file distributed with this file.

import { ChillsSurveillanceClient } from "../../external/chillsSurveillanceClient";
import { ChillsModels, defineChillsModels } from "../../models/db/chills";
import { SplitSql } from "../../util/sql";
import logger from "../../util/logger";

export class ChillsSurveillanceService {
  private readonly data: ChillsSurveillanceClient;
  private readonly models: ChillsModels;
  private readonly sql: SplitSql;

  constructor(sql: SplitSql, data: ChillsSurveillanceClient) {
    this.models = defineChillsModels(sql);
    this.sql = sql;
    this.data = data;
  }

  public async import(progress: () => void): Promise<void> {
    const clinicalReport = await this.data.getLatestClinicalReport();

    if (clinicalReport != null) {
      logger.info("Importing clinical report");
      await this.sql.nonPii.transaction(async t => {
        for (let i = 0; i < clinicalReport.contents.length; i++) {
          await this.models.clinicalSurveillance.upsert(
            clinicalReport.contents[i],
            { transaction: t }
          );
          progress();
        }
      });
    }

    const iliNetReport = await this.data.getLatestILINetReport();

    if (iliNetReport != null) {
      logger.info("Importing ILINet report");
      await this.sql.nonPii.transaction(async t => {
        for (let i = 0; i < iliNetReport.contents.length; i++) {
          await this.models.iliNetSurveillance.upsert(
            iliNetReport.contents[i],
            { transaction: t }
          );
          progress();
        }
      });
    }
  }
}
