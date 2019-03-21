// Copyright (c) 2019 by Audere
//
// Use of this source code is governed by an MIT-style license that
// can be found in the LICENSE file distributed with this file.

import { UWUploader } from "./uwUploader";
import { S3Config } from "../util/s3Config";

/**
 * Uploads recurring reports for the UW to S3.
 */
export class S3Uploader implements UWUploader {
  private readonly s3: AWS.S3;
  private readonly config: S3Config;
  private readonly env: string = process.env.NODE_ENV.toLowerCase();

  constructor(s3: AWS.S3, config: S3Config) {
    this.s3 = s3;
    this.config = config;
  }

  public async sendIncentives(batch: number, contents: string): Promise<void> {
    // YYYY-MM-DD
    const now = new Date().toISOString().substring(0, 10);
    const file = `FluHome_GiftCardToSend_${batch}.${now}.csv`;
    const key = `${this.env}/outgoing/gift-card-reports/${file}`;

    const params = {
      Bucket: this.config.bucket,
      Key: key,
      Body: contents
    };

    await this.s3.putObject(params).promise();
  }

  public async sendKits(batch: number, contents: string): Promise<void> {
    // YYYY-MM-DD
    const now = new Date().toISOString().substring(0, 10);
    const file = `Kit-Fulfillment-Report-${batch}.${now}.csv`;
    const key = `${this.env}/outgoing/fulfillment-order-reports/${file}`;

    const params = {
      Bucket: this.config.bucket,
      Key: key,
      Body: contents
    };

    await this.s3.putObject(params).promise();
  }

  public async sendFollowUps(batch: number, contents: string): Promise<void> {
    // YYYY-MM-DD
    const now = new Date().toISOString().substring(0, 10);
    const file = `FluHome_FollowUpSurveyToSend_${batch}.${now}.csv`;
    const key = `${this.env}/outgoing/fulfillment-order-reports/${file}`;

    const params = {
      Bucket: this.config.bucket,
      Key: key,
      Body: contents
    };

    await this.s3.putObject(params).promise();
  }

  public async writeBarcodeErrors(contents: string): Promise<void> {
    // YYYY-MM-DD
    const now = new Date().toISOString().substring(0, 19)
      .replace("T", "-")
      .replace(/:/g, "");
    const file = `FluHome_BarcodeErrors.${now}.csv`;
    const key = `${this.env}/outgoing/received-kits/${file}`;

    const params = {
      Bucket: this.config.bucket,
      Key: key,
      Body: contents
    };

    await this.s3.putObject(params).promise();
  }
}
