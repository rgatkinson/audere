// Copyright (c) 2019 by Audere
//
// Use of this source code is governed by an MIT-style license that
// can be found in the LICENSE file distributed with this file.

import { FirebaseReceiver } from "../external/firebase";
import { ImportProblem } from "../models/importProblem";
import { Model } from "../util/sql";
import logger from "../util/logger";

export type DocumentSnapshot = FirebaseFirestore.DocumentSnapshot;

// We import every hour, try importing for up to one day before giving up.
const MAX_IMPORT_ATTEMPTS = 24;

export class FirebaseDocumentService {
  private readonly importProblems: Model<ImportProblem>;

  protected async importItems(
    reqId: string,
    markAsRead: boolean,
    collection: string,
    write: (
      snapshot: DocumentSnapshot,
      receiver: FirebaseReceiver
    ) => Promise<void>,
    firebase: FirebaseReceiver,
    result: ImportResult,
    progress: () => void
  ) {
    const updates = await this.updatesWithRetry(firebase);

    for (let id of updates) {
      const spec = { id, collection };
      let snapshot: DocumentSnapshot;

      try {
        snapshot = await firebase.read(spec.id);
      } catch (err) {
        await this.updateImportProblem(reqId, spec, err, result);
      }

      if (snapshot != null) {
        try {
          await write(snapshot, firebase);
          if (markAsRead) {
            await firebase.markAsRead(snapshot);
          }
          result.successes.push(spec);
        } catch (err) {
          const attempts = await this.updateImportProblem(
            reqId,
            spec,
            err,
            result
          );
          if (markAsRead && attempts >= MAX_IMPORT_ATTEMPTS) {
            await firebase.markAsRead(snapshot);
          }
        }
      }
      progress();
    }
  }

  // We have seen failure alerts where Firebase fails with an authentication
  // error and then consistently succeeds one minute later.  Since we only ever
  // see failures on the first run after a long idle, this retries in an
  // attempt to debug and potentially work around the issue.
  private async updatesWithRetry(
    firebase: FirebaseReceiver
  ): Promise<string[]> {
    for (let i = 0; i < 5; i++) {
      try {
        return await firebase.updates();
      } catch (err) {
        logger.error(`updatesWithRetry: '${err.message}'`);
      }
      await new Promise(resolve => setTimeout(resolve, 10 * 1000));
    }
    return await firebase.updates();
  }

  private async updateImportProblem(
    reqId: string,
    spec: ImportSpec,
    err: Error,
    result: ImportResult
  ): Promise<number> {
    logger.error(
      `${reqId} import failed for '${spec.id}' in '${spec.collection}': ${err.message}`
    );

    const firebaseCollection = spec.collection;
    const firebaseId = spec.id;
    const existing = await this.importProblems.findOne({
      where: { firebaseCollection, firebaseId },
    });

    const problem = {
      id: existing == null ? undefined : existing.id,
      firebaseCollection,
      firebaseId,
      attempts: existing == null ? 1 : existing.attempts + 1,
      lastError: err.message,
    };
    result.errors.push(this.asImportError(problem));
    await this.importProblems.upsert(problem);
    return problem.attempts;
  }

  private asImportError(problem: ImportProblem): ImportError {
    return {
      collection: problem.firebaseCollection,
      id: problem.firebaseId,
      error: problem.lastError,
      attempts: problem.attempts,
    };
  }
}

export interface ImportResult {
  requestId: string;
  timestamp: string;
  successes: ImportSpec[];
  errors: ImportError[];
}

export interface ImportSpec {
  collection: string;
  id: string;
}

export interface ImportError extends ImportSpec {
  error: string;
  attempts: number;
}
