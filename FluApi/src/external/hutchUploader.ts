// Copyright (c) 2018 by Audere
//
// Use of this source code is governed by an MIT-style license that
// can be found in the LICENSE file distributed with this file.

import { AxiosInstance } from "axios";
import { Encounter } from "audere-lib/hutchProtocol";
import { ThrottledTaskQueue } from "../util/throttledTaskQueue";
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

  constructor(
    api: AxiosInstance,
    maxConcurrent: number,
    user: string,
    password: string
  ) {
    this.api = api;
    this.maxConcurrent = maxConcurrent;
    this.user = user;
    this.password = password;
  }

  /**
   * Push encounters to the flu study.
   * @param encounters Encounters to be sent keyed by database id.
   */
  public async uploadEncounters(encounters: Encounter[]): Promise<void> {
    // Wraps the upload function in a task queue that limits concurrency.
    const requests = encounters.map(e => () => this.upload(e));
    const queue = new ThrottledTaskQueue(requests, this.maxConcurrent);
    await queue.drain();

    logger.info(
      encounters.length + " records were uploaded to the Hutch endpoint"
    );
  }

  /**
   * Handles HTTP upload of a single record.
   * @param id Identifier for the encounter. Used to track success.
   * @param e Encounter to upload.
   */
  private async upload(e: Encounter): Promise<void> {
    try {
      await this.api.post("api/enrollment", e, {
        auth: {
          username: this.user,
          password: this.password,
        },
        headers: {
          "Content-Type": "application/json",
        },
      });
    } catch (error) {
      logger.error(`Call to upload encounter ${e.id} from ${e.site} failed`);

      if (error.response != null) {
        logger.error(`Unexpected status code ${error.response.status}`);
      }

      throw error;
    }
  }
}
