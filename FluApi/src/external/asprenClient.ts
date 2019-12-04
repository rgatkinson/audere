// Copyright (c) 2019 by Audere
//
// Use of this source code is governed by an MIT-style license that
// can be found in the LICENSE file distributed with this file.

import * as XLSX from "xlsx";
import parse from "csv-parse/lib/sync";
import {
  AsprenDataAttributes,
  CurrentSeasonVaccinationStatus,
  IndigenousStatus,
  PreviousSeasonVaccinationStatus,
} from "../models/db/cough";
import { S3Config } from "../util/s3Config";
import logger from "../util/logger";

export interface AsprenReportFile {
  key: string;
  hash: string;
  records: AsprenDataAttributes[];
}

/**
 * Accessor for ASPREN data.
 */
export class AsprenClient {
  private readonly s3: AWS.S3;
  private readonly config: S3Config;

  constructor(s3: AWS.S3, config: S3Config) {
    this.s3 = s3;
    this.config = config;
  }

  /**
   * Fetches the last modified & most recent ASPREN report.
   */
  public async getLatestAsprenReport(): Promise<AsprenReportFile> {
    const listParams = {
      Bucket: this.config.asprenReportsBucket,
    };

    const objects = await this.s3.listObjectsV2(listParams).promise();
    logger.info(`${objects.KeyCount} keys listed in ASPREN bucket.`);

    const metadata = objects.Contents.reduce((prev, curr) => {
      if (curr.Key.endsWith(".xlsx")) {
        const prevMs = prev.LastModified.getTime();
        const currMs = curr.LastModified.getTime();
        return prevMs > currMs ? prev : curr;
      } else {
        return prev;
      }
    });

    if (metadata == null) {
      logger.info(`No XLSX files found.`);
      return;
    }

    logger.info(
      `${metadata.Key} is the most recent file in the ASPREN bucket.`
    );

    const getParams = {
      Bucket: this.config.asprenReportsBucket,
      Key: metadata.Key,
      IfMatch: metadata.ETag,
    };

    const object = await this.s3.getObject(getParams).promise();
    const wb = XLSX.read(object.Body, { type: "buffer" });

    if (!wb.SheetNames.includes("Data")) {
      throw Error(`${metadata.Key} does not contain a Data sheet.`);
    }

    const sheet = wb.Sheets["Data"];
    const csv = XLSX.utils.sheet_to_csv(sheet);
    const report = parse(csv, { columns: true });

    if (!Array.isArray(report)) {
      throw Error(`Contents of ${metadata.Key} could not be parsed.`);
    }

    const rows = <any[]>report;

    if (!this.validRow(rows[0])) {
      throw Error(`Rows from ${metadata.Key} do not contain expected fields.`);
    }

    const records = rows.map(row => this.mapRecord(row));

    return {
      key: metadata.Key,
      hash: metadata.ETag,
      records: records,
    };
  }

  // Case-insensitive property get
  private getByKey(key: string, obj: any): any {
    const casedKey = this.searchKey(key, obj);

    if (casedKey != null) {
      return obj[casedKey];
    } else {
      return undefined;
    }
  }

  private containsValue(value: string, obj: any): boolean {
    const keys = Object.keys(obj);
    const match = keys.find(k => obj[k] === value);
    return match != null;
  }

  // Case-insensitive search for matching object key
  private searchKey(key: string, obj: any): string | null {
    const keys = Object.keys(obj);
    const match = keys.find(k => k.toLowerCase() == key.toLowerCase());

    if (match == null) {
      logger.warn(`Key ${key} was not found in passed object`);
    }

    return match;
  }

  private validRow(row: any): boolean {
    return (
      this.searchKey("ATSI", row) != null &&
      this.searchKey("CURRENT_SEASON_VACC", row) != null &&
      this.searchKey("VACC_PREV_SEASON", row) != null &&
      this.searchKey("OVERSEAS", row) != null &&
      this.searchKey("DATE_OF_VACC", row) != null &&
      this.searchKey("COMORBIDITIES_DESCRIPTION", row) != null &&
      this.searchKey("SA Pathology Barcode", row) != null &&
      this.searchKey("Referred", row) != null &&
      this.searchKey("Dr State", row) != null &&
      this.searchKey("ADENO_RESULT", row) != null &&
      this.searchKey("B_PERTUSSIS_RESULT", row) != null &&
      this.searchKey("FLU_A_RESULT", row) != null &&
      this.searchKey("FLU_B_RESULT", row) != null &&
      this.searchKey("H1N1(2009)", row) != null &&
      this.searchKey("H3N2", row) != null &&
      this.searchKey("METAPNEUMOVIRUS_RES", row) != null &&
      this.searchKey("MYCO_PNEUMONIAE_RES", row) != null &&
      this.searchKey("PARA_1_RESULT", row) != null &&
      this.searchKey("PARA_2_RESULT", row) != null &&
      this.searchKey("PARA_3_RESULT", row) != null &&
      this.searchKey("RHINOVIRUS_RESULT", row) != null &&
      this.searchKey("RSV_RESULT", row) != null &&
      this.searchKey("VICTORIA", row) != null &&
      this.searchKey("YAMAGATA", row) != null &&
      this.searchKey("DATE_ONSET", row) != null &&
      this.searchKey("COMORBIDITIES", row) != null &&
      this.searchKey("HCW_STATUS", row) != null
    );
  }

  /**
   * Attempts to format a row from the ASPREN report as a DB record.
   *
   * @param row Raw file row from an ASPREN report.
   */
  private mapRecord(row: any): AsprenDataAttributes {
    const atsi = this.getByKey("ATSI", row);
    this.validateAtsi(atsi);

    const currentVaccination = this.getByKey("CURRENT_SEASON_VACC", row);
    this.validateCurrentVacc(currentVaccination);

    const previousVaccination = this.getByKey("VACC_PREV_SEASON", row);
    this.validatePreviousVacc(previousVaccination);

    const overseas = this.getByKey("OVERSEAS", row);
    let overseasLocation;
    let overseasIllness;

    if (overseas === "N") {
      overseasIllness = false;
    } else if (overseas !== "B") {
      overseasIllness = true;
      overseasLocation = overseas;
    }

    const vaccinationDate = this.getByKey("DATE_OF_VACC", row);
    const comorbitiesDescription = this.getByKey(
      "COMORBIDITIES_DESCRIPTION",
      row
    );

    return {
      barcode: this.getByKey("SA Pathology Barcode", row),
      encounterDate: this.getByKey("Referred", row),
      encounterState: this.getByKey("Dr State", row),
      adenoResult: this.parseZeroOne(this.getByKey("ADENO_RESULT", row)),
      pertussisResult: this.parseZeroOne(
        this.getByKey("B_PERTUSSIS_RESULT", row)
      ),
      fluAResult: this.parseZeroOne(this.getByKey("FLU_A_RESULT", row)),
      fluBResult: this.parseZeroOne(this.getByKey("FLU_B_RESULT", row)),
      h1n1Result: this.parseZeroOne(this.getByKey("H1N1(2009)", row)),
      h3n2Result: this.parseZeroOne(this.getByKey("H3N2", row)),
      metapneumovirusResult: this.parseZeroOne(
        this.getByKey("METAPNEUMOVIRUS_RES", row)
      ),
      mycopneumoniaResult: this.parseZeroOne(
        this.getByKey("MYCO_PNEUMONIAE_RES", row)
      ),
      para1Result: this.parseZeroOne(this.getByKey("PARA_1_RESULT", row)),
      para2Result: this.parseZeroOne(this.getByKey("PARA_2_RESULT", row)),
      para3Result: this.parseZeroOne(this.getByKey("PARA_3_RESULT", row)),
      rhinovirusResult: this.parseZeroOne(
        this.getByKey("RHINOVIRUS_RESULT", row)
      ),
      rsvResult: this.parseZeroOne(this.getByKey("RSV_RESULT", row)),
      victoriaResult: this.parseZeroOne(this.getByKey("VICTORIA", row)),
      yamagataResult: this.parseZeroOne(this.getByKey("YAMAGATA", row)),
      aboriginalOrIslander: atsi === "B" ? undefined : atsi,
      dateOnset: this.getByKey("DATE_ONSET", row),
      currentVaccination:
        currentVaccination === "B" ? undefined : currentVaccination,
      vaccinationDate: vaccinationDate === "B" ? undefined : vaccinationDate,
      previousVaccination:
        previousVaccination === "B" ? undefined : previousVaccination,
      comorbities: this.parseYesNo(this.getByKey("COMORBIDITIES", row)),
      comorbitiesDescription:
        comorbitiesDescription === "B" ? undefined : comorbitiesDescription,
      healthcareWorkerStatus: this.parseYesNo(this.getByKey("HCW_STATUS", row)),
      overseasIllness: overseasIllness,
      overseasLocation: overseasLocation,
    };
  }

  private parseZeroOne(input: string): boolean {
    switch (input) {
      case "Equivocal":
        return false;
      case "0":
        return false;
      case "1":
        return true;
      case "":
        return undefined;
      case null:
        return undefined;
      default:
        throw Error(`Unable to parse boolean 0/1 value from ${input}.`);
    }
  }

  private parseYesNo(input: string): boolean {
    switch (input.toLowerCase()) {
      case "y":
        return true;
      case "n":
        return false;
      case "b":
        return undefined;
      case "unknown":
        return undefined;
      default:
        throw Error(`Unable to parse boolean yes/no value from ${input}.`);
    }
  }

  private validateAtsi(input: string): void {
    if (input !== "B" && !this.containsValue(input, IndigenousStatus)) {
      throw Error(`Invalid ATSI value, ${input}.`);
    }
  }

  private validateCurrentVacc(input: string): void {
    if (
      input !== "B" &&
      !this.containsValue(input, CurrentSeasonVaccinationStatus)
    ) {
      throw Error(`Invalid current vaccination status, ${input}.`);
    }
  }

  private validatePreviousVacc(input: string): void {
    if (
      input !== "B" &&
      !this.containsValue(input, PreviousSeasonVaccinationStatus)
    ) {
      throw Error(`Invalid previous vaccination status, ${input}.`);
    }
  }
}
