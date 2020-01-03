// Copyright (c) 2019 by Audere
//
// Use of this source code is governed by an MIT-style license that
// can be found in the LICENSE file distributed with this file.

import { MTLReportAttributes } from "../models/db/chills";
import { S3File, S3Records } from "../models/s3File";
import { S3Config } from "../util/s3Config";
import zlib from "zlib";
import logger from "../util/logger";
import { ListObjectsV2Request } from "aws-sdk/clients/s3";

export interface UpdateWithStatus {
  update: MTLReportUpdate;
  status: string;
}

/**
 * Sequelize attributes for upsert. Includes a list of specific fields to update
 * since the underlying model is a coalesce of several separate updates.
 */
export interface MTLReportUpdate {
  report: MTLReportAttributes;
  fields: string[];
}

/**
 * Client for listing & retrieving MTL files from S3.
 */
export class EvidationMTLClient {
  private readonly s3: AWS.S3;
  private readonly config: S3Config;

  private readonly validStates = [
    "kit_received",
    "kit_rejected",
    "kit_shipped",
    "processing",
    "report_ready",
  ];

  constructor(s3: AWS.S3, config: S3Config) {
    this.s3 = s3;
    this.config = config;
  }

  /**
   * Lists files in the MTL directory from the environment bucket, including the
   * file hashes to determine whether a particular file has been processed.
   */
  public async listMTLFiles(): Promise<S3File[]> {
    let list: ListObjectsV2Request = {
      Bucket: this.config.evidationBucket,
      Prefix: "homekit2020/mtl",
    };

    let truncated = false;
    const files = [];

    // ListObjects returns up to 1,000 objects so we page through all results
    do {
      const objects = await this.s3.listObjectsV2(list).promise();
      logger.info(
        `Page of ${objects.Contents.length} MTL keys listed from Evidation bucket.`
      );

      truncated = objects.IsTruncated;
      if (truncated) {
        list.ContinuationToken = objects.NextContinuationToken;
      }

      const filtered = objects.Contents.filter(o =>
        o.Key.endsWith(".jsonl.gz")
      );
      files.push(...filtered);
    } while (truncated);

    logger.info(`${files.length} total files listed from Evidation bucket.`);

    return files.map(f => {
      return {
        key: f.Key,
        hash: f.ETag,
      };
    });
  }

  /**
   * Get the contents of a particular file formatted as a database model.
   *
   * @param file Key and hash of the file to retrieve
   */
  public async getMTLReport(
    file: S3File
  ): Promise<S3Records<UpdateWithStatus>> {
    const getParams = {
      Bucket: this.config.evidationBucket,
      Key: file.key,
      IfMatch: file.hash,
    };

    const object = await this.s3.getObject(getParams).promise();
    const unzip = new Promise(function(resolve, reject) {
      zlib.gunzip(<Buffer>object.Body, function(error, result) {
        if (!error) {
          resolve(result);
        } else {
          reject(error);
        }
      });
    });
    const decompressed = await unzip;
    const update = JSON.parse(decompressed.toString());

    if (!this.validStatus(update)) {
      throw Error(
        `Status update from ${file.key} did not contain expected fields.`
      );
    }

    const output = {
      update: this.mapStatusUpdate(update),
      status: update["order_state"],
    };
    return { file: file, records: [output] };
  }

  private validStatus(status: any): boolean {
    return (
      status["order_id"] != null &&
      status["order_state"] != null &&
      this.validStates.some(s => s === status["order_state"])
    );
  }

  private mapStatusUpdate(status: any): MTLReportUpdate {
    switch (status["order_state"]) {
      case "kit_received":
        return this.mapKitReceived(status);
      case "kit_rejected":
        return this.mapKitRejection(status);
      case "kit_shipped":
        return this.mapShippedEvent(status);
      case "processing":
        return this.mapProcessingEvent(status);
      case "report_ready":
        return this.mapReportEvent(status);
    }
  }

  private mapKitReceived(status: any): MTLReportUpdate {
    if (status["data"] == null) {
      throw Error(`Kit received event does not include data fields.`);
    }

    const data = status["data"];

    if (data["accession_number"] == null) {
      throw Error(`Invalid Evidation ID in kit received event.`);
    }

    const update = {
      orderId: status["order_id"].toString(),
      received: true,
      receivedTimestamp: data["received_datetime"],
    };

    return {
      report: update,
      fields: Object.keys(update),
    };
  }

  private mapKitRejection(status: any): MTLReportUpdate {
    if (status["data"] == null) {
      throw Error(`Kit rejection event does not include data fields.`);
    }

    const data = status["data"];

    if (data["accession_number"] == null) {
      throw Error(`Invalid Evidation ID in kit rejection event.`);
    }

    const update = {
      orderId: status["order_id"].toString(),
      rejected: true,
      evidationId: data["accession_number"],
      rejectionReason: data["rejected_reason"],
    };

    return {
      report: update,
      fields: Object.keys(update),
    };
  }

  private mapShippedEvent(status: any): MTLReportUpdate {
    if (status["data"] == null) {
      throw Error(`Shipped kit event does not include data fields.`);
    }

    const data = status["data"];

    if (data["accession_number"] == null) {
      throw Error(`Invalid Evidation ID in shipped kit event.`);
    }

    const update = {
      orderId: status["order_id"].toString(),
      shipped: true,
      evidationId: data["accession_number"],
      outboundBarcode: data["outbound"],
      inboundBarcode: data["inbound"],
      shippedTimestamp: data["shipped_datetime"],
      kitRegistrationCode: data["kit_reg_code"],
    };

    return {
      report: update,
      fields: Object.keys(update),
    };
  }

  private mapProcessingEvent(status: any): MTLReportUpdate {
    if (status["user"] == null) {
      throw Error(`Kit processing event does not include user data.`);
    }

    const user = status["user"];
    const update = {
      orderId: status["order_id"].toString(),
      processing: true,
      gender: user["gender"],
      birthdate: user["birthdate"],
      email: user["email"],
      phone: user["phone"],
      firstName: user["first_name"],
      lastName: user["last_name"],
      zipCode: user["zip_code"],
    };

    return {
      report: update,
      fields: Object.keys(update),
    };
  }

  private mapReportEvent(status: any): MTLReportUpdate {
    if (status["data"] == null) {
      throw Error(`Shipped kit event does not include data fields.`);
    }

    const data = status["data"];

    if (data["accession_number"] == null) {
      throw Error(`Invalid Evidation ID in shipped kit event.`);
    }

    if (data["observations"] == null) {
      const update = {
        orderId: status["order_id"].toString(),
        processed: true,
        evidationId: data["accession_number"],
      };

      return {
        report: update,
        fields: Object.keys(update),
      };
    } else {
      const observations = data["observations"];
      const fluA = observations.find(o =>
        this.lowerCaseContains(o["test_name"], "Flu A")
      );
      const fluB = observations.find(o =>
        this.lowerCaseContains(o["test_name"], "Flu B")
      );
      const rsv = observations.find(o =>
        this.lowerCaseContains(o["test_name"], "RSV")
      );

      const update = {
        orderId: status["order_id"].toString(),
        orderNumber: status["order_number"],
        processed: true,
        evidationId: data["accession_number"],
        stripTempStatus: status["tempstrip_status"],
        fluAResult: this.parseTestResult(fluA["result"]),
        fluAValue: Number.isNaN(+fluA["result_value"])
          ? undefined
          : +fluA["result_value"],
        fluASNP: fluA["snp"],
        fluAAssayTimestamp: fluA["assay_datetime"],
        fluBResult: this.parseTestResult(fluB["result"]),
        fluBValue: Number.isNaN(+fluB["result_value"])
          ? undefined
          : +fluB["result_value"],
        fluBSNP: fluB["snp"],
        fluBAssayTimestamp: fluB["assay_datetime"],
        rsvResult: this.parseTestResult(rsv["result"]),
        rsvValue: Number.isNaN(+rsv["result_value"])
          ? undefined
          : +rsv["result_value"],
        rsvSNP: rsv["snp"],
        rsvAssayTimestamp: rsv["assay_datetime"],
      };

      this.removeNullProperties(update);

      return {
        report: update,
        fields: Object.keys(update),
      };
    }
  }

  private lowerCaseContains(o: any, s: string): boolean {
    if (typeof o !== "string") {
      throw Error("Cannot compare a type which is not a string");
    }

    return o.toLowerCase().indexOf(s.toLowerCase()) > -1;
  }

  private parseTestResult(result: string): boolean {
    switch (result) {
      case "Detected":
        return true;
      case "Not Detected":
        return false;
      default:
        return null;
    }
  }

  /**
   * Removed empty object keys. Null values that are left on the database model
   * may create invalid SQL in upserts so we remove those keys.
   *
   * @param object
   */
  private removeNullProperties(object: any): void {
    const keys = Object.keys(object);
    keys.forEach(k => {
      if (object[k] == null || object[k] === "") {
        delete object[k];
      }
    });
  }
}
