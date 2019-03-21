// Copyright (c) 2019 by Audere
//
// Use of this source code is governed by an MIT-style license that
// can be found in the LICENSE file distributed with this file.

import { S3Config } from "../util/s3Config";
import { KitRecord } from "../models/kitRecord";
import parse from "csv-parse/lib/sync";

export class S3Retriever {
  private readonly s3: AWS.S3;
  private readonly config: S3Config;
  private readonly env: string = process.env.NODE_ENV.toLowerCase();

  constructor(s3: AWS.S3, config: S3Config) {
    this.s3 = s3;
    this.config = config;
  }

  public async listReceivedKitFiles(): Promise<string[]> {
    const request = {
      Bucket: this.config.bucket,
      Delimiter: "/",
      Prefix: `${this.env}/incoming/received-kits/`
    };

    const result = await this.s3.listObjectsV2(request).promise();

    return result.Contents.map(c => c.Key);
  }

  public async retrieveReceivedKits(
    files: string[]
  ): Promise<Map<string, KitRecord[]>> {
    const contents: Map<string, KitRecord[]> = new Map();

    for (let i = 0; i < files.length; i++) {
      const request = {
        Bucket: this.config.bucket,
        Key: files[i]
      };

      const result = await this.s3.getObject(request).promise();
      const content = result.Body.toString('utf-8');
      const rows = parse(content).slice(1);
      const records = [];

      rows.forEach(row => {
        const barcode = row[1] == null ?
          undefined :
          (row[1] + "").toLowerCase();
        records.push({
          dateReceived: row[0],
          boxBarcode: barcode,
          utmBarcode: row[2],
          rdtBarcode: row[3],
          stripBarcode: row[4]
        });
      });

      contents.set(files[i], records);
    }

    return contents;
  }
}
