// Copyright (c) 2018 by Audere
//
// Use of this source code is governed by an MIT-style license that
// can be found in the LICENSE file distributed with this file.

import { defineFeverModels, FeverModels } from "../../models/db/fever";
import { KitRecord } from "../../models/kitRecord";
import { SplitSql } from "../../util/sql";
import Sequelize from "sequelize";
import sequelize = require("sequelize");

export class ReceivedKitsData {
  private readonly fever: FeverModels;
  private readonly sql: SplitSql;

  constructor(sql: SplitSql) {
    this.fever = defineFeverModels(sql);
    this.sql = sql;
  }

  public async filterExistingBarcodes(barcodes: string[]): Promise<string[]> {
    const existing = await this.fever.receivedKit.findAll({
      where: {
        boxBarcode: barcodes
      }
    });

    const codes = existing.map(e => e.boxBarcode);
    return barcodes.filter(x => !codes.includes(x));
  }

  public async findFilesToProcess(files: string[]): Promise<string[]> {
    const processed = await this.fever.receivedKitsFile.findAll({
      where: {
        file: files.map(x => x.toLowerCase())
      }
    });

    const keys = processed.map(x => x.file);
    return files.filter(x => !keys.includes(x.toLowerCase()));
  }

  public async findSurveyByBarcode(barcode: string): Promise<number | null> {
    const survey = await this.fever.surveyNonPii.findOne({
      where: {
        [Sequelize.Op.and]: [
          Sequelize.literal(`lower(survey->>'samples')::jsonb @> '[{\"code\":\"${barcode.toLowerCase()}\"}]'`)
        ]
      }
    });

    return survey == null ? null : +survey.id;
  }

  public async importReceivedKits(
    file: string,
    receivedKits: Map<number, KitRecord>
  ): Promise<void> {
    return this.sql.nonPii.transaction(async t => {
      const f = await this.fever.receivedKitsFile.create(
        { file: file.toLowerCase() },
        {
          returning: true,
          transaction: t
        }
      );

      if (receivedKits.size > 0) {
        const records = [];
        receivedKits.forEach((v, k) => 
           records.push({
            surveyId: k,
            fileId: f.id,
            boxBarcode: v.boxBarcode,
            dateReceived: v.dateReceived
          })
        );

        await this.fever.receivedKit.bulkCreate(records, { transaction: t });
      }
    });
  }
}