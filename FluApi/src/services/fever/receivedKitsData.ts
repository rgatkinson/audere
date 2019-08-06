// Copyright (c) 2018 by Audere
//
// Use of this source code is governed by an MIT-style license that
// can be found in the LICENSE file distributed with this file.

import {
  defineFeverModels,
  FeverModels,
  ReceivedKitAttributes,
} from "../../models/db/fever";
import { KitRecord } from "../../models/kitRecord";
import { SplitSql } from "../../util/sql";
import Sequelize from "sequelize";
import { AddressInfoUse, EventInfo } from "audere-lib/feverProtocol";
import { RecordSurveyMapping } from "../../external/redCapClient";

export interface MatchedBarcode {
  id: number;
  code: string;
  kitId?: number;
  recordId?: number;
  fileId?: number;
}

export interface UntrackedBarcode {
  id: number;
  code: string;
  scannedAt: string;
  state: string;
  recordId?: number;
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
   * Finds barcodes that are not linked to the REDCap system. Surveys should be
   * marked as linked to REDCap after the Audere supplied fields are uploaded.
   */
  public async findUnlinkedBarcodes(): Promise<UntrackedBarcode[]> {
    const untrackedSamples = await this.sql.nonPii.query(
      `select distinct
         s.id id,
         s.csruid csruid,
         lower(ss->>'code') code,
         s.survey->>'events' events,
         k."recordId" "recordId"
       from
         fever_current_surveys s,
         json_array_elements(s.survey->'samples') ss
         join fever_box_barcodes b on lower(ss->>'code') = b.barcode
         left join fever_received_kits k on lower(ss->>'code') = k."boxBarcode"
       where
         s.survey->>'isDemo' = 'false'
         and ss->>'sample_type' in ('manualEntry', 'org.iso.Code128')
         and (s.id = k."surveyId" or k."surveyId" is null)
         and (k.linked is null or k.linked = false)
       order by s.id`,
      { type: Sequelize.QueryTypes.SELECT }
    );

    if (untrackedSamples.length === 0) {
      return [];
    }

    // Get the participant's address information to dervice state
    const piiData = await this.fever.surveyPii.findAll({
      where: {
        csruid: untrackedSamples.map(s => <string>s.csruid),
      },
    });

    const states = new Map();
    piiData.forEach((v, k) => {
      const address = v.survey.patient.address.find(
        a => a.use === AddressInfoUse.Home
      );

      if (address != null) {
        states.set(v.csruid, address.state);
      }
    });

    // Filter down to a single survey (the most recent scan) per barcode
    const results = new Map();

    untrackedSamples.forEach(s => {
      // Get the most recent scan event timestamp
      const events = s.events ? <EventInfo[]>JSON.parse(s.events) : [];

      const scannedAt = events
        .filter(
          e =>
            e.kind === "appNav" &&
            (e.refId === "ManualConfirmation" || e.refId === "ScanConfirmation")
        )
        .reduce<string>(
          (a, b) => (a < b.at || a == null ? b.at : a),
          undefined
        );

      const code = <string>s.code;

      const existing = results.get(code);

      if (
        existing == null ||
        existing.scannedAt == null ||
        existing.scannedAt < scannedAt
      ) {
        results.set(code, {
          id: +s.id,
          code: <string>s.code,
          scannedAt: scannedAt,
          state: states.get(s.csruid),
          recordId: s.recordId ? <string>s.recordId : undefined,
        });
      }
    });

    return Array.from(results.values());
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
      throw Error(
        `Barcodes ${invalidBarcodes.join(", ")} were in an ` +
          `unexpected format. matchBarcodes expects 8 lowercase characters ` +
          `from the English alphabet or numbers 0-9.`
      );
    }

    const result = await this.sql.nonPii.query(
      `select distinct
         s.id id,
         ss->>'code' code,
         k.id "kitId",
         k."recordId" "recordId",
         k."fileId" "fileId"
       from
         fever_current_surveys s
         left join fever_received_kits k on s.id = k."surveyId",
         json_array_elements(s.survey->'samples') ss
       where
         lower(ss->>'code') in ('${barcodes.join("', '")}')`,
      { type: Sequelize.QueryTypes.SELECT }
    );

    return <MatchedBarcode[]>result;
  }

  /**
   * Tracks barcode-to-survey associations in the database. Since barcodes are
   * constrained to a known list of values we assume that the user supplied
   * barcode will not change if it matches a received, physical barcode.
   */
  public async importReceivedKits(
    file: string,
    receivedKits: Map<number, KitRecord>
  ): Promise<void> {
    return this.sql.nonPii.transaction(
      { isolationLevel: Sequelize.Transaction.ISOLATION_LEVELS.SERIALIZABLE },
      async t => {
        const f = await this.fever.receivedKitsFile.create(
          { file: file.toLowerCase() },
          {
            returning: true,
            transaction: t,
          }
        );

        if (receivedKits.size > 0) {
          const existing = await this.fever.receivedKit.findAll({
            where: {
              surveyId: Array.from(receivedKits.keys()),
            },
          });

          const records: ReceivedKitAttributes[] = [];

          // At the moment we only care about box barcodes
          receivedKits.forEach((v, k) => {
            const match = existing.find(e => e.surveyId === k);
            const linked =
              v.remapped === true || match == null ? false : match.linked;

            records.push({
              surveyId: k,
              recordId: v.recordId,
              fileId: f.id,
              linked: linked,
              boxBarcode: v.boxBarcode,
              dateReceived: v.dateReceived,
            });
          });

          for (let i = 0; i < records.length; i++) {
            await this.fever.receivedKit.upsert(records[i], {
              transaction: t,
            });
          }
        }
      }
    );
  }

  /**
   * Connects a set of kits to lab records. Either creates a new record or
   * updates an existing record if we have already processed lab results.
   *
   * @param records A map of REDCap record to Audere survey connections keyed by
   * the user supplied barcode
   */
  public async linkKits(
    records: Map<string, RecordSurveyMapping>
  ): Promise<void> {
    const keys = Array.from(records.keys());
    return this.sql.nonPii.transaction(async t => {
      for (let i = 0; i < keys.length; i++) {
        const k = keys[i];
        const v = records.get(k);
        await this.fever.receivedKit.upsert(
          {
            surveyId: v.surveyId,
            recordId: v.recordId,
            boxBarcode: k,
            linked: true,
            dateReceived: undefined,
            fileId: undefined,
          },
          {
            transaction: t,
            fields: ["recordId", "boxBarcode", "linked"],
          }
        );
      }
    });
  }
}
