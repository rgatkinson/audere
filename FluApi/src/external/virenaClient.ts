// Copyright (c) 2019 by Audere
//
// Use of this source code is governed by an MIT-style license that
// can be found in the LICENSE file distributed with this file.

import * as XLSX from "xlsx";
import parse from "csv-parse/lib/sync";
import { VirenaRecordAttributes } from "../models/db/chills";
import { getByKey, searchKey, searchKeys } from "../util/caseInsensitive";
import { S3Config } from "../util/s3Config";
import logger from "../util/logger";

export interface S3File {
  key: string;
  hash: string;
}

export interface VirenaRecordsFile {
  file: S3File;
  records: VirenaRecordAttributes[];
}

/**
 * Accessor for Virena data.
 */
export class VirenaClient {
  private readonly s3: AWS.S3;
  private readonly config: S3Config;

  constructor(s3: AWS.S3, config: S3Config) {
    this.s3 = s3;
    this.config = config;
  }

  /**
   * Fetches metadata about all uploaded Virena files
   */
  public async listVirenaFiles(): Promise<S3File[]> {
    const listParams = {
      Bucket: this.config.virenaRecordsBucket,
      Prefix: "virena",
    };

    const objects = await this.s3.listObjectsV2(listParams).promise();
    logger.info(`${objects.Contents.length} keys listed in Virena bucket.`);

    const excelFiles = objects.Contents.filter(
      o => o.Key.endsWith(".xlsb") || o.Key.endsWith(".xlsx")
    );

    return excelFiles.map(f => {
      return {
        key: f.Key,
        hash: f.ETag,
      };
    });
  }

  /**
   * Retrieves and parses the contents of a Virena file
   *
   * @param files Metadata for file to retrieve
   */
  public async getVirenaRecords(file: S3File): Promise<VirenaRecordsFile> {
    const getParams = {
      Bucket: this.config.virenaRecordsBucket,
      Key: file.key,
      IfMatch: file.hash,
    };

    const object = await this.s3.getObject(getParams).promise();
    const wb = XLSX.read(object.Body, { type: "buffer" });

    const sheet = wb.Sheets[wb.SheetNames[0]];
    const csv = parse(XLSX.utils.sheet_to_csv(sheet), { columns: true });

    if (!Array.isArray(csv)) {
      throw Error(`Contents of ${file.key} could not be parsed.`);
    }

    const rows = <any[]>csv;

    if (!this.validRow(rows[0])) {
      throw Error(`Rows from ${file.key} do not contain expected fields.`);
    }

    const records = rows.map(row => this.mapRecord(row));
    return { file: file, records };
  }

  private validRow(row: any): boolean {
    return (
      searchKey("SofiaSerNum", row) != null &&
      searchKey("TestDate", row) != null &&
      searchKey("Facility", row) != null &&
      searchKey("City", row) != null &&
      searchKey("State", row) != null &&
      searchKey("Zip", row) != null &&
      searchKey("PatientAge", row) != null &&
      searchKey("Result1", row) != null &&
      searchKey("Result2", row) != null &&
      searchKey("OverallResult", row) != null &&
      searchKey("County", row) != null &&
      searchKeys(["FacilityDescription", "FacilityType"], row) != null
    );
  }

  /**
   * Attempts to format a row from the Virena file as a DB record.
   *
   * @param row Raw file row from a Virena file.
   */
  private mapRecord(row: any): VirenaRecordAttributes {
    const facilityKey = searchKeys(
      ["FacilityDescription", "FacilityType"],
      row
    );

    return {
      serialNumber: getByKey("SofiaSerNum", row),
      testDate: getByKey("TestDate", row),
      facility: getByKey("Facility", row),
      city: getByKey("City", row),
      state: getByKey("State", row),
      zip: getByKey("Zip", row),
      patientAge: getByKey("PatientAge", row),
      result1: this.parseTestResult(getByKey("Result1", row)),
      result2: this.parseTestResult(getByKey("Result2", row)),
      overallResult: this.parseTestResult(getByKey("OverallResult", row)),
      county: getByKey("County", row),
      facilityDescription: getByKey(facilityKey, row),
    };
  }

  private parseTestResult(input: string): boolean {
    switch (input.toLowerCase()) {
      case "positive":
        return true;
      case "negative":
        return false;
      case "invalid":
        return undefined;
      default:
        throw Error(`Unable to parse boolean from test result value ${input}.`);
    }
  }
}
