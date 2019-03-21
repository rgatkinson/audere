// Copyright (c) 2018 by Audere
//
// Use of this source code is governed by an MIT-style license that
// can be found in the LICENSE file distributed with this file.

import { S3Retriever } from "../../external/s3Retriever";
import { UWUploader } from "../../external/uwUploader";
import { ReceivedKitsData } from "./receivedKitsData";
import { KitRecord } from "../../models/kitRecord";
import { parse } from "json2csv";
import logger from "../../util/logger";

export class ReceivedKits {
  private readonly dao: ReceivedKitsData;
  private readonly retriever: S3Retriever;
  private readonly uploader: UWUploader;

  constructor(
    dao: ReceivedKitsData,
    retriever: S3Retriever,
    uploader: UWUploader
  ) {
    this.dao = dao;
    this.retriever = retriever;
    this.uploader = uploader;
  }

  public async importReceivedKits() {
    const files = await this.retriever.listReceivedKitFiles();
    const toProcess = await this.dao.findFilesToProcess(files);

    if (toProcess.length > 0) {
      const contents = await this.retriever.retrieveReceivedKits(toProcess);
      const keys = Array.from(contents.keys());

      for (let i = 0; i < keys.length; i++) {
        const records = contents.get(keys[i]);
        const errors = [];
        const barcodeRecords: Map<string, KitRecord> = new Map();
        const kitsBySurvey: Map<number, KitRecord> = new Map();

        // Check that the box barcode is a valid format - a combination of 8
        // numbers and letters
        records.forEach(r => {
          if (r.boxBarcode != null && /^[0-9a-zA-Z]{8}$/.test(r.boxBarcode)) {
            barcodeRecords.set(r.boxBarcode, r);
          } else {
            logger.error(`Box barcode has invalid format: ${r.boxBarcode}`);
            errors.push(this.createBarcodeError(r, "InvalidBarcode"));
          }
        });

        if (barcodeRecords.size > 0) {
          // Filter out previously assigned barcodes, this view of the data may
          // not be accurate if the db is servicing simultaneous requests
          const barcodes = Array.from(barcodeRecords.keys());
          const newBarcodes = await this.dao
            .filterExistingBarcodes(barcodes);

          // Check that the box barcode can be associated to a survey
          for (let j = 0; newBarcodes != null && j < newBarcodes.length; j++) {
            const r = barcodeRecords.get(newBarcodes[j]);
            const surveyId = await this.dao
              .findSurveyByBarcode(r.boxBarcode);

            if (surveyId != null) {
              kitsBySurvey.set(surveyId, r);
            } else {
              logger.error(`Barcode doesn't match any survey: ${r.boxBarcode}`);
              errors.push(this.createBarcodeError(r, "NoMatch"));
            }
          }
        }

        // Write errors for tracking
        if (errors.length > 0) {
          const csv = parse(errors, { header: true });
          this.uploader.writeBarcodeErrors(csv);
        }

        // Insert the file metadata and barcode mappings
        await this.dao.importReceivedKits(keys[i], kitsBySurvey);
      }
    } else {
      logger.info("No files to process")
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