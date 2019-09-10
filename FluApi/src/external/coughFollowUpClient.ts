// Copyright (c) 2019 by Audere
//
// Use of this source code is governed by an MIT-style license that
// can be found in the LICENSE file distributed with this file.

import { S3Config } from "../util/s3Config";
import parse from "csv-parse/lib/sync";
import logger from "../util/logger";

// A generic CSV file with pertinent S3 metadata
export interface CoughFollowUpSurveyFile {
  key: string;
  hash: string;
  records: string[][];
}

/**
 * Retrieves Qualtrics reports from S3 with follow up survey information for the
 * Cough project.
 */
export class CoughFollowUpClient {
  private readonly s3: AWS.S3;
  private readonly config: S3Config;

  constructor(s3: AWS.S3, config: S3Config) {
    this.s3 = s3;
    this.config = config;
  }

  /**
   * Retrieve CSV files from the configured bucket, returning the contents of
   * the last modified.
   */
  public async getFollowUpSurveys(): Promise<CoughFollowUpSurveyFile> {
    const listParams = {
      Bucket: this.config.coughFollowUpBucket,
    };

    const objects = await this.s3.listObjectsV2(listParams).promise();
    logger.info(
      `${objects.KeyCount} keys listed in Cough follow-up survey ` + `bucket.`
    );

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
      `${metadata.Key} is the most recent file in the Cough follow-up survey ` +
        `bucket.`
    );

    const getParams = {
      Bucket: this.config.coughFollowUpBucket,
      Key: metadata.Key,
      IfMatch: metadata.ETag,
    };

    const object = await this.s3.getObject(getParams).promise();

    // We will traverse by index instead of converting columns to properties.
    // This gives us flexibility in which header row to use (there are multiple)
    const survey = parse(object.Body.toString(), { columns: false });

    return {
      key: metadata.Key,
      hash: metadata.ETag,
      records: <string[][]>survey,
    };
  }
}
