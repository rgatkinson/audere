// Copyright (c) 2019 by Audere
//
// Use of this source code is governed by an MIT-style license that
// can be found in the LICENSE file distributed with this file.

import parse from "csv-parse/lib/sync";
import {
  AsprenDataAttributes,
  CurrentSeasonVaccinationStatus,
  IndigenousStatus,
  PreviousSeasonVaccinationStatus
} from "../models/db/cough";
import { S3Config } from "../util/s3Config";

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
      Bucket: this.config.asprenReportsBucket
    };

    const objects = await this.s3.listObjectsV2(listParams).promise();
    const metadata = objects.Contents.reduce((prev, curr) => {
      const prevMs = prev.LastModified.getUTCMilliseconds();
      const currMs = curr.LastModified.getUTCMilliseconds();
      return prevMs > currMs ? prev : curr;
    });

    const getParams = {
      Bucket: this.config.asprenReportsBucket,
      Key: metadata.Key,
      IfMatch: metadata.ETag
    };

    const object = await this.s3.getObject(getParams).promise();
    const report = parse(object.Body.toString(), { columns: true });

    if (!Array.isArray(report)) {
      throw new Error(`Contents of ${metadata.Key} could not be parsed.`);
    }

    const rows = <any[]>report;
    const records = rows.map(row => this.mapRecord(row));

    return {
      key: metadata.Key,
      hash: metadata.ETag,
      records: records
    };
  }

  /**
   * Attempts to format a row from the ASPREN report as a DB record.
   *
   * @param row Raw file row from an ASPREN report.
   */
  private mapRecord(row: any): AsprenDataAttributes {
    const atsi = row["ATSI"];
    this.validateAtsi(atsi);

    const currentVaccination = row["CURRENT_SEASON_VACC"];
    this.validateCurrentVacc(currentVaccination);

    const previousVaccination = row["VACC_PREV_SEASON"];
    this.validatePreviousVacc(previousVaccination);

    const overseas = row["OVERSEAS"];
    let overseasLocation;
    let overseasIllness;

    // Yes answers are in the format of Y, ${country}.  Country is a place
    // abroad where the illness may have been contracted.
    if (/^Y\,\s\w+$/.test(overseas)) {
      overseasIllness = true;
      overseasLocation = overseas
        .toString()
        .split(",")[1]
        .trim();
    } else if (overseas === "N") {
      overseasIllness = false;
    } else if (overseas !== "B") {
      throw new Error(`Overseas answer, ${overseas}, could not be parsed.`);
    }

    const vaccinationDate = row["DATE_OF_VACC"];
    const comorbitiesDescription = row["COMORBIDITIES_DESCRIPTION"];

    return {
      barcode: row["SA Pathology barcode"],
      encounterDate: row["Referred"],
      encounterState: row["Dr State"],
      adenoResult: this.parseZeroOne(row["ADENO_RESULT"]),
      pertussisResult: this.parseZeroOne(row["B_PERTUSSIS_RESULT"]),
      fluAResult: this.parseZeroOne(row["FLU_A_RESULT"]),
      fluBResult: this.parseZeroOne(row["FLU_B_RESULT"]),
      h1n1Result: this.parseZeroOne(row["H1N1(2009)"]),
      h3n2Result: this.parseZeroOne(row["H3N2"]),
      metapneumovirusResult: this.parseZeroOne(row["METAPNEUMOVIRUS_RES"]),
      mycopneumoniaResult: this.parseZeroOne(row["MYCO_PNEUMONIAE_RES"]),
      para1Result: this.parseZeroOne(row["PARA_1_RESULT"]),
      para2Result: this.parseZeroOne(row["PARA_2_RESULT"]),
      para3Result: this.parseZeroOne(row["PARA_3_RESULT"]),
      rhinovirusResult: this.parseZeroOne(row["RHINOVIRUS_RESULT"]),
      rsvResult: this.parseZeroOne(row["RHINOVIRUS_RESULT"]),
      victoriaResult: this.parseZeroOne(row["VICTORIA"]),
      yamagataResult: this.parseZeroOne(row["YAMAGATA"]),
      aboriginalOrIslander: atsi === "B" ? undefined : atsi,
      dateOnset: row["DATE_ONSET"],
      currentVaccination:
        currentVaccination === "B" ? undefined : currentVaccination,
      vaccinationDate: vaccinationDate === "B" ? undefined : vaccinationDate,
      previousVaccination:
        previousVaccination === "B" ? undefined : previousVaccination,
      comorbities: this.parseYesNo(row["COMORBIDITIES"]),
      comorbitiesDescription:
        comorbitiesDescription === "B" ? undefined : comorbitiesDescription,
      healthcareWorkerStatus: this.parseYesNo(row["HCW_STATUS"]),
      overseasIllness: overseasIllness,
      overseasLocation: overseasLocation
    };
  }

  private parseZeroOne(input: string): boolean {
    switch (input) {
      case "0":
        return true;
      case "1":
        return false;
      default:
        throw new Error(`Unable to parse boolean 0/1 value from ${input}.`);
    }
  }

  private parseYesNo(input: string): boolean {
    switch (input) {
      case "Y":
        return true;
      case "N":
        return false;
      case "B":
        return undefined;
      default:
        throw new Error(`Unable to parse boolean yes/no value from ${input}.`);
    }
  }

  private validateAtsi(input: string): void {
    if (input !== "B" && !Object.values(IndigenousStatus).includes(input)) {
      throw new Error(`Invalid ATSI value, ${input}.`);
    }
  }

  private validateCurrentVacc(input: string): void {
    if (
      input !== "B" &&
      !Object.values(CurrentSeasonVaccinationStatus).includes(input)
    ) {
      throw new Error(`Invalid current vaccination status, ${input}.`);
    }
  }

  private validatePreviousVacc(input: string): void {
    if (
      input !== "B" &&
      !Object.values(PreviousSeasonVaccinationStatus).includes(input)
    ) {
      throw new Error(`Invalid previous vaccination status, ${input}.`);
    }
  }
}
