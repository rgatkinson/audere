// Copyright (c) 2019 by Audere
//
// Use of this source code is governed by an MIT-style license that
// can be found in the LICENSE file distributed with this file.

import { S3Config } from "../util/s3Config";

/**
 * Uploads recurring reports for the UW to S3.
 */
export class S3Uploader {
  private readonly s3: AWS.S3;
  private readonly config: S3Config;
  private readonly env: string = process.env.NODE_ENV.toLowerCase();

  constructor(s3: AWS.S3, config: S3Config) {
    this.s3 = s3;
    this.config = config;
  }

  private async writeObject(key: string, contents: string): Promise<void> {
    const params = {
      Bucket: this.config.bucket,
      Key: key,
      Body: contents
    };

    await this.s3.putObject(params).promise();
  }

  public async sendIncentives(batch: number, contents: string): Promise<void> {
    // YYYY-MM-DD
    const now = new Date().toISOString().substring(0, 10);
    const file = `FluHome_GiftCardToSend_${batch}.${now}.csv`;
    const key = `${this.env}/outgoing/gift-card-reports/${file}`;
    await this.writeObject(key, contents);
  }

  public async sendKits(batch: number, contents: string): Promise<void> {
    // YYYY-MM-DD
    const now = new Date().toISOString().substring(0, 10);
    const file = `Kit-Fulfillment-Report-${batch}.${now}.csv`;
    const key = `${this.env}/outgoing/fulfillment-order-reports/${file}`;
    await this.writeObject(key, contents);
  }

  public async sendFollowUps(batch: number, contents: string): Promise<void> {
    // YYYY-MM-DD
    const now = new Date().toISOString().substring(0, 10);
    const file = `FluHome_FollowUpSurveyToSend_${batch}.${now}.csv`;
    const key = `${this.env}/outgoing/fulfillment-order-reports/${file}`;
    await this.writeObject(key, contents);
  }

  public async writeAtHomeData(
    fileName: string,
    contents: string
  ): Promise<string> {
    const key = `${this.env}/incoming/lab-data/${fileName}`;
    await this.writeObject(key, contents);
    return key;
  }

  public async writeBarcodeErrors(
    fileName: string,
    contents: string
  ): Promise<void> {
    const key = `${this.env}/outgoing/received-kits/${fileName}`;
    await this.writeObject(key, contents);
  }

  public async writeHipaaForm(
    group: string,
    fileName: string,
    contents: string
  ): Promise<void> {
    const key = `${this.env}/shared/hipaa-forms/${group}/${fileName}`;
    await this.writeObject(key, contents);
  }
}
