// Copyright (c) 2019 by Audere
//
// Use of this source code is governed by an MIT-style license that
// can be found in the LICENSE file distributed with this file.

import parse from "csv-parse/lib/sync";
import {
  ClinicalSurveillanceAttributes,
  ILINetSurveillanceAttributes,
} from "../models/db/chills";
import logger from "../util/logger";

export interface SurveillanceFile<T> {
  contents: T[];
}

export class ChillsSurveillanceClient {
  private readonly cdcData: Object;

  constructor(cdcData: Object) {
    this.cdcData = cdcData;
  }

  public async getLatestClinicalReport(): Promise<
    SurveillanceFile<ClinicalSurveillanceAttributes>
  > {
    const file = parse(this.cdcData["clinical"], { columns: true });

    if (!this.isValidClinical(file[0])) {
      throw Error(`Rows from file do not contain expected fields.`);
    }

    return {
      contents: file.map(this.mapClinicalRow),
    };
  }

  private isValidClinical(row: any): boolean {
    return (
      row["REGION"] != null &&
      row["YEAR"] != null &&
      row["WEEK"] != null &&
      row["TOTAL SPECIMENS"] != null &&
      row["TOTAL A"] != null &&
      row["TOTAL B"] != null
    );
  }

  private mapClinicalRow(row: any): ClinicalSurveillanceAttributes {
    const specimens =
      row["TOTAL SPECIMENS"] === "X" ? 0 : row["TOTAL SPECIMENS"];
    const aPositive = row["TOTAL A"] === "X" ? 0 : row["TOTAL A"];
    const bPositive = row["TOTAL B"] === "X" ? 0 : row["TOTAL B"];

    return {
      state: row["REGION"],
      year: row["YEAR"],
      week: row["WEEK"],
      specimens,
      aPositive,
      bPositive,
    };
  }

  public async getLatestILINetReport(): Promise<
    SurveillanceFile<ILINetSurveillanceAttributes>
  > {
    const file = parse(this.cdcData["ilinet"], { columns: true });

    if (!this.isValidILINet(file[0])) {
      throw Error(`Rows from file do not contain expected fields.`);
    }

    return {
      contents: file.map(this.mapILINetRow),
    };
  }

  private isValidILINet(row: any): boolean {
    return (
      row["REGION"] != null &&
      row["YEAR"] != null &&
      row["WEEK"] != null &&
      row["ILITOTAL"] != null &&
      row["NUM. OF PROVIDERS"] != null &&
      row["TOTAL PATIENTS"] != null
    );
  }

  private mapILINetRow(row: any): ILINetSurveillanceAttributes {
    const patients = row["TOTAL PATIENTS"] === "X" ? 0 : row["TOTAL PATIENTS"];
    const providers =
      row["NUM. OF PROVIDERS"] === "X" ? 0 : row["NUM. OF PROVIDERS"];
    const positive = row["ILITOTAL"] === "X" ? 0 : row["ILITOTAL"];

    return {
      state: row["REGION"],
      year: row["YEAR"],
      week: row["WEEK"],
      patients,
      providers,
      positive,
    };
  }
}
