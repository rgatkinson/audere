// Copyright (c) 2018 by Audere
//
// Use of this source code is governed by an MIT-style license that
// can be found in the LICENSE file distributed with this file.

import { ReceivedKitsData } from "./receivedKitsData";
import { KitRecord } from "../../models/kitRecord";
import { S3Uploader } from "../../external/s3Uploader";
import { REDCapRetriever } from "../../external/redCapRetriever";
import { parse } from "json2csv";
import logger from "../../util/logger";

/**
 * Retrieves lab data to identify kits that have been successfully returned and
 * processed & associates them to their corresponding survey.
 */
export class ReceivedKits {
  private readonly dao: ReceivedKitsData;
  private readonly retriever: REDCapRetriever;
  private readonly uploader: S3Uploader;

  constructor(
    dao: ReceivedKitsData,
    retriever: REDCapRetriever,
    uploader: S3Uploader
  ) {
    this.dao = dao;
    this.retriever = retriever;
    this.uploader = uploader;
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

  /**
   * Imports processed kit data.  Polls for new files and checks them against
   * previously processed files by name to find new files for import.
   */
  public async importReceivedKits() {
    const data = await this.retriever.getAtHomeData();

    if (data.length > 0) {
      const timestamp = this.getDateAndTimeString();
      const labFile = `FluHome_Lab_Data_${timestamp}.json`;
      const s3File = await this.uploader
        .writeAtHomeData(labFile, JSON.stringify(data));

      const errors = [];
      const validBarcodes: Map<string, KitRecord> = new Map();
      const kitsBySurvey: Map<number, KitRecord> = new Map();

      data.forEach(r => {
        if (r.boxBarcode != null && /^[0-9a-zA-Z]{8}$/.test(r.boxBarcode)) {
          r.boxBarcode = r.boxBarcode.toLowerCase();
          r.rdtBarcode = r.rdtBarcode.toLowerCase();
          r.stripBarcode = r.stripBarcode.toLowerCase();
          r.utmBarcode = r.utmBarcode.toLowerCase();
          validBarcodes.set(r.boxBarcode, r);
        } else {
          logger.error(`[Import Kits] Box barcode has invalid format: ` +
            r.boxBarcode);
          errors.push(this.createBarcodeError(r, "InvalidBarcode"));
        }
      });

      if (validBarcodes.size > 0) {
        const codes = Array.from(validBarcodes.keys());
        const matches = await this.dao.matchBarcodes(codes) || [];

        // Check that the box barcode can be associated to a survey
        codes.forEach(code => {
          const match = matches.find(m => m.code === code);
          const r = validBarcodes.get(code);

          if (match == null) {
            logger.error(`[Import Kits] Barcode doesn't match any survey: ` +
              r.boxBarcode);
            errors.push(this.createBarcodeError(r, "NoMatch"));
          } else if (match.kitId != null) {
            logger.debug(`[Import Kits] Barcode ${code} was already ` +
              `matched and can be ignored`);
          } else {
            kitsBySurvey.set(match.id, r);
          }
        });
      } else {
        logger.info(`[Import Kits] No new barcodes to process`);
      }

      // Write errors for tracking
      if (errors.length > 0) {
        logger.info(`[Import Kits] Posting ${errors.length} errors`);
        const csv = parse(errors, { header: true });
        const errorFile = `FluHome_BarcodeErrors_${timestamp}.csv`;
        this.uploader.writeBarcodeErrors(errorFile, csv);
      }

      // Insert the file metadata and barcode mappings
      logger.info(`[Import Kits] Committing ${s3File} as processed with `
        + `${kitsBySurvey.size} new barcodes`);
      await this.dao.importReceivedKits(s3File, kitsBySurvey);
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
