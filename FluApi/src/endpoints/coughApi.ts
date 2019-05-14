// Copyright (c) 2019 by Audere
//
// Use of this source code is governed by an MIT-style license that
// can be found in the LICENSE file distributed with this file.

import { SplitSql } from "../util/sql";
import { defineCoughModels, CoughModels } from "../models/db/cough";
import {
  connectorFromSqlSecrets,
  FirebaseReceiver
} from "../external/firebase";
import logger from "../util/logger";
import { requestId } from "../util/expressApp";

export class CoughEndpoint {
  private readonly sql: SplitSql;
  private readonly models: CoughModels;

  constructor(sql: SplitSql) {
    this.sql = sql;
    this.models = defineCoughModels(sql);
  }

  public importCoughDocuments = async (req, res, next) => {
    const result = await this.importDocuments(requestId(req));
    res.json(result);
  };

  private async importDocuments(reqId: string): Promise<ImportResult> {
    const receiver = new FirebaseReceiver(connectorFromSqlSecrets(this.sql));
    const updates = await receiver.updates();
    const result = {
      succeeded: [],
      failed: [],
      timestamp: new Date().toISOString()
    };

    for (let id of updates) {
      try {
        await this.importDocument(receiver, id);
        result.succeeded.push(id);
        logger.debug(`${reqId} CoughEndpoint imported ${id}`);
      } catch (err) {
        const error = err.message;
        result.failed.push({ id, error });
        logger.error(
          `${reqId} CoughEndpoint import failed for '${id}': ${error}`
        );
      }
    }
    logger.info(
      `${reqId} CoughEndpoint imported ${result.succeeded.length}/${
        updates.length
      } updates`
    );

    return result;
  }

  private async importDocument(
    receiver: FirebaseReceiver,
    id: string
  ): Promise<void> {
    // TODO specify doc type
    const doc: any = await receiver.read(id);
    await this.models.survey.upsert(doc);
    await receiver.markAsRead(doc);
  }
}

export interface ImportResult {
  succeeded: string[];
  failed: ImportError[];
  timestamp: string;
}

export interface ImportError {
  id: string;
  error: string;
}
