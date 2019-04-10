// Copyright (c) 2018 by Audere
//
// Use of this source code is governed by an MIT-style license that
// can be found in the LICENSE file distributed with this file.

import { defineFeverModels, FeverModels } from "../../models/db/fever";
import { KitRecord } from "../../models/kitRecord";
import { SplitSql } from "../../util/sql";
import Sequelize from "sequelize";

export interface MatchedBarcode {
  id: number,
  code: string,
  kitId?: number
}

/**
 * Tracks barcode information about physically receivied kits against surveys.
 */
export class ReceivedKitsData {
  private readonly fever: FeverModels;
  private readonly sql: SplitSql;

  constructor(sql: SplitSql) {
    this.fever = defineFeverModels(sql);
    this.sql = sql;
  }

  /**
   * Matches a list of barcodes against samples collected in user surveys with
   * detail about whether the association between the barcode and survey has
   * already been seen & tracked.
   *
   * @param barcodes Array of 8 character barcodes restricted to the characters
   * 0-9 and a-z
   */
  public async matchBarcodes(barcodes: string[]): Promise<MatchedBarcode[]> {
    const invalidBarcodes = [];
    barcodes.forEach(b => {
      if (!/^[0-9a-z]{8}$/.test(b)) {
        invalidBarcodes.push(b);
      }
    });

    if (invalidBarcodes.length > 0) {
      throw Error(`Barcodes ${invalidBarcodes.join(", ")} were in an ` +
        `unexpected format. matchBarcodes expects 8 lowercase characters ` +
        `from the English alphabet or numbers 0-9.`);
    }

    const result = await this.sql.nonPii.query(
      `select s.id id, ss->'code' code, k.id "kitId"
       from
         fever_current_surveys s
         left join fever_received_kits k on s.id = k."surveyId",
         json_array_elements(s.survey->'samples') ss
       where
         lower(ss->>'code') in ('${barcodes.join("', '")}')`,
      { type: Sequelize.QueryTypes.SELECT }
    );

    return <MatchedBarcode[]>result
  }

  /**
   * Tracks barcode-to-survey associations in the database. Since barcodes are
   * constrained to a known list of values we assume that the user supplied
   * barcode will not change if it matches a received, physiical barcode.
   */
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
        // At the moment we only care about box barcodes
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
