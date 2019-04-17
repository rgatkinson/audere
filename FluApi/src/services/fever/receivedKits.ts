// Copyright (c) 2018 by Audere
//
// Use of this source code is governed by an MIT-style license that
// can be found in the LICENSE file distributed with this file.

import { ReceivedKitsData } from "./receivedKitsData";
import { KitRecord } from "../../models/kitRecord";
import { S3Uploader } from "../../external/s3Uploader";
import { REDCapClient } from "../../external/redCapClient";
import { parse } from "json2csv";
import logger from "../../util/logger";

/**
 * Retrieves lab data to identify kits that have been successfully returned and
 * processed & associates them to their corresponding survey.
 */
export class ReceivedKits {
  private readonly dao: ReceivedKitsData;
  private readonly redcap: REDCapClient;
  private readonly uploader: S3Uploader;

  constructor(
    dao: ReceivedKitsData,
    redcap: REDCapClient,
    uploader: S3Uploader
  ) {
    this.dao = dao;
    this.redcap = redcap;
    this.uploader = uploader;
  }

  /**
   * Exports barcodes from the Audere system to REDCap for UW lab researchers.
   */
  public async exportBarcodes(): Promise<void> {
    logger.info("[Export Barcodes] Finding unlinked records");
    const unlinked = await this.dao.findUnlinkedBarcodes();

    if (unlinked != null && unlinked.length > 0) {
      logger.info(`[Export Barcodes] Provisioning ${unlinked.length} barcodes`);
      const records = await this.redcap.provisionBarcodes(unlinked);
      logger.info(`[Export Barcodes] Linking ${records.size} REDCap records`);
      await this.dao.linkKits(records);
    } else {
      logger.info(`[Export Barcodes] No unlinked barcodes found`);
    }
  }

  private getDateAndTimeString(): string {
    const pad2 = (n: number) => n.toFixed().padStart(2, "0");
    const now = new Date();
    return now.getFullYear() +
      pad2(now.getMonth()) +
      pad2(now.getDate()) +
      pad2(now.getHours()) +
      pad2(now.getMinutes()) +
      pad2(now.getSeconds());
  }

  private async getAtHomeData(
    backupFile: string
  ): Promise<[string, KitRecord[]]> {
    logger.info("[Import Kits] Fetching at home data from REDCap");
    const data = await this.redcap.getAtHomeData();

    if (data.length > 0) {
      logger.info(`[Import Kits] Writing at home data report to S3 with ` +
        `${data.length} rows`);
      const key = await this.uploader
        .writeAtHomeData(backupFile, JSON.stringify(data));
      return [key, data];
    } else {
      logger.warn("[Import Kits] Downloaded empty at home data report");
      return [null, null];
    }
  }

  private async matchBarcodes(
    records: KitRecord[]
  ): Promise<[Map<number, KitRecord>, any[]]> {
    const errors = [];
    const codes = Array.from(new Set(records.map(b => b.boxBarcode)));
    logger.info(`[Import Kits] Matching ${records.length} barcodes`);
    const matches = await this.dao.matchBarcodes(codes) || [];

    // Check that the box barcode can be associated to a survey
    const matchesByCode = new Map();
    matches.forEach((v, k) => {
      matchesByCode.set(v.code, v);
    });

    const kitsBySurvey: Map<number, KitRecord> = new Map();

    records.forEach(r => {
      if (!matchesByCode.has(r.boxBarcode)) {
        logger.error(`[Import Kits] Barcode doesn't match any survey: ` +
          r.boxBarcode);
        errors.push(this.createBarcodeError(r, "NoMatch"));
      } else {
        const match = matchesByCode.get(r.boxBarcode);
        if (match.recordId == null ||
           (match.recordId === r.recordId && match.kitId == null)) {
          kitsBySurvey.set(match.id, r);
        } else {
          logger.debug(`[Import Kits] Barcode ${r.boxBarcode} was already ` +
          `matched and can be ignored`);
        }
      }
    });

    logger.info(`[Import Kits] Matching resulted in ${kitsBySurvey.size} ` +
      `matches and ${errors.length} errors`);
    return [kitsBySurvey, errors];
  }

  private async validateBarcodes(
    data: KitRecord[]
  ): Promise<[KitRecord[], any[]]> {
    const errors = [];
    const validBarcodes: KitRecord[] = [];

    data.forEach(r => {
      if (r.boxBarcode != null && /^[0-9a-zA-Z]{8}$/.test(r.boxBarcode)) {
        r.boxBarcode = r.boxBarcode.toLowerCase();
        r.rdtBarcode = r.rdtBarcode.toLowerCase();
        r.stripBarcode = r.stripBarcode.toLowerCase();
        r.utmBarcode = r.utmBarcode.toLowerCase();
        validBarcodes.push(r);
      } else {
        logger.error(`[Import Kits] Box barcode has invalid format: ` +
          r.boxBarcode);
        errors.push(this.createBarcodeError(r, "InvalidBarcode"));
      }
    });

    return [validBarcodes, errors];
  }

  /**
   * Imports processed kit data.  Polls for new files and checks them against
   * previously processed files by name to find new files for import.
   */
  public async importReceivedKits(): Promise<void> {
    const timestamp = this.getDateAndTimeString();
    const backupFile = `FluHome_Lab_Data_${timestamp}.json`;
    const [key, data] = await this.getAtHomeData(backupFile);

    if (data != null && data.length > 0) {
      const errors = [];
      const [validBarcodes, barcodeErrors] = await this.validateBarcodes(data);

      if (barcodeErrors.length > 0) {
        errors.push(...barcodeErrors);
      }

      let kitsBySurvey: Map<number, KitRecord> = new Map();
  
      if (validBarcodes.length > 0) {
        const [matches, matchErrors] =
          await this.matchBarcodes(validBarcodes);
        kitsBySurvey = matches;

        if (matchErrors.length > 0) {
          errors.push(...matchErrors);
        }
      } else {
        logger.info(`[Import Kits] No new barcodes to process`);
      }

      // Write errors for tracking
      if (errors.length > 0) {
        const errorFile = `FluHome_BarcodeErrors_${timestamp}.csv`;
        logger.info(`[Import Kits] Posting ${errors.length} errors`);
        const csv = parse(errors, { header: true });
        this.uploader.writeBarcodeErrors(errorFile, csv);
      }

      // Insert the file metadata and barcode mappings
      logger.info(`[Import Kits] Committing ${key} as processed with `
        + `${kitsBySurvey.size} new barcodes`);
      await this.dao.importReceivedKits(key, kitsBySurvey);
    } else {
      logger.info(`[Import Kits] No files to process`);
    }
  }

  private createBarcodeError(record: KitRecord, cause: string) {
    return {
      "Date received": record.dateReceived,
      "Box barcode": record.boxBarcode,
      "UTM barcode": record.utmBarcode,
      "RDT barcode": record.rdtBarcode,
      "Strip barcode": record.stripBarcode,
      "Error comment": cause
    };
  }
}
