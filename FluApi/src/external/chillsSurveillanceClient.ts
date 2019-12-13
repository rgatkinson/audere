// Copyright (c) 2019 by Audere
//
// Use of this source code is governed by an MIT-style license that
// can be found in the LICENSE file distributed with this file.

import parse from "csv-parse/lib/sync";
import {
  ClinicalSurveillanceAttributes,
  ILINetSurveillanceAttributes,
} from "../models/db/chills";
import { S3Config } from "../util/s3Config";
import logger from "../util/logger";

export interface SurveillanceFile<T> {
  contents: T[];
  key: string;
  hash: string;
}

export class ChillsSurveillanceClient {
  private readonly s3: AWS.S3;
  private readonly config: S3Config;

  constructor(s3: AWS.S3, config: S3Config) {
    this.s3 = s3;
    this.config = config;
  }

  public async getLatestClinicalReport(): Promise<
    SurveillanceFile<ClinicalSurveillanceAttributes>
  > {
    const file = await this.getLatest("clinical");

    if (!this.isValidClinical(file.contents[0])) {
      throw Error(`Rows from ${file.key} do not contain expected fields.`);
    }

    return {
      contents: file.contents.map(this.mapClinicalRow),
      key: file.key,
      hash: file.hash,
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
    const file = await this.getLatest("ilinet");

    if (!this.isValidILINet(file.contents[0])) {
      throw Error(`Rows from ${file.key} do not contain expected fields.`);
    }

    return {
      contents: file.contents.map(this.mapILINetRow),
      key: file.key,
      hash: file.hash,
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
    const positive = row["TOTAL PATIENTS"] === "X" ? 0 : row["TOTAL PATIENTS"];

    return {
      state: row["REGION"],
      year: row["YEAR"],
      week: row["WEEK"],
      patients,
      providers,
      positive,
    };
  }

  private async getLatest(prefix: string): Promise<SurveillanceFile<any[]>> {
    const listParams = {
      Bucket: this.config.virenaRecordsBucket,
      Prefix: `cdc/${prefix}`,
    };

    const objects = await this.s3.listObjectsV2(listParams).promise();
    logger.info(`${objects.KeyCount} keys listed in CDC bucket.`);

    const metadata = objects.Contents.reduce((prev, curr) => {
      if (curr.Key.endsWith(".csv")) {
        const prevMs = prev.LastModified.getTime();
        const currMs = curr.LastModified.getTime();
        return prevMs > currMs ? prev : curr;
      } else {
        return prev;
      }
    });

    if (metadata == null) {
      logger.info(`No CSV files found.`);
      return;
    }

    logger.info(
      `${metadata.Key} is the most recent ${prefix} file in the CDC bucket.`
    );

    const getParams = {
      Bucket: this.config.virenaRecordsBucket,
      Key: metadata.Key,
      IfMatch: metadata.ETag,
    };

    const object = await this.s3.getObject(getParams).promise();
    const report = parse(object.Body.toString(), { columns: true });

    return {
      contents: <any[]>report,
      key: metadata.Key,
      hash: metadata.ETag,
    };
  }
}
