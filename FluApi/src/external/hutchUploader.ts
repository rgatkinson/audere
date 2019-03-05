// Copyright (c) 2018 by Audere
//
// Use of this source code is governed by an MIT-style license that
// can be found in the LICENSE file distributed with this file.

import { AxiosInstance } from "axios";
import { Encounter } from "audere-lib/hutchProtocol";
import { ThrottledTaskQueue } from "../util/throttledTaskQueue";
import { HutchUploadModel } from "../models/hutchUpload";
import logger from "../util/logger";

/**
 * Pushes encounter records to the flu study via HTTP and tracks uploaded
 * encounters in the database.
 */
export class HutchUploader {
  private readonly api: AxiosInstance;
  private readonly maxConcurrent: number;
  private readonly user: string;
  private readonly password: string;
  private readonly uploads: HutchUploadModel;

  constructor(
    api: AxiosInstance,
    maxConcurrent: number,
    user: string,
    password: string,
    uploads: HutchUploadModel
  ) {
    this.api = api;
    this.maxConcurrent = maxConcurrent;
    this.user = user;
    this.password = password;
    this.uploads = uploads;
  }

  /**
   * Push encounters to the flu study.
   * @param encounters Encounters to be sent keyed by database id.
   */
  public async uploadEncounters(
    encounters: Map<number, Encounter>
  ): Promise<number[]> {
    // Wraps the upload function in a task queue that limits concurrency.
    const keys = Array.from(encounters.keys());
    const requests = keys.map(k => () => this.upload(k, encounters.get(k)));
    const queue = new ThrottledTaskQueue(requests, this.maxConcurrent);
    const result = await queue.drain();

    logger.info(
      encounters.size +
        " records were provided and " +
        result.length +
        " records were uploaded to the Hutch endpoint"
    );
    return result;
  }

  /**
   * Handles HTTP upload of a single record.
   * @param id Identifier for the encounter. Used to track success.
   * @param e Encounter to upload.
   */
  private async upload(id: number, e: Encounter): Promise<number> {
    try {
      await this.api.post("api/enrollment", e, {
        auth: {
          username: this.user,
          password: this.password
        },
        headers: {
          "Content-Type": "application/json"
        }
      });
      return id;
    } catch (error) {
      // Anything that does not get to the point of handling a response is a
      // hard error.
      if (error.response != null) {
        logger.warn(
          "Unexpected status code uploading encounter " +
            error.response.status.toString()
        );
      } else {
        logger.error(
          "Call to upload encounter " +
            id.toString() +
            " failed with no response."
        );
        throw error;
      }
    }
  }

  /**
   * Writes a record of an upload to the database to indicate completeness for
   * this workflow.
   * @param ids Database identifiers for the records successfully uploaded.
   */
  public async commitUploads(ids: number[]): Promise<number[]> {
    if (ids.length === 0) {
      return [];
    }

    const uploadIds = ids.map(id => ({ visitId: id }));
    const dbRecords = await this.uploads.bulkCreate(uploadIds);
    return dbRecords.map(u => u.visitId);
  }
}
