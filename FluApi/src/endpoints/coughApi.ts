// Copyright (c) 2019 by Audere
//
// Use of this source code is governed by an MIT-style license that
// can be found in the LICENSE file distributed with this file.

import { SplitSql } from "../util/sql";
import { CoughModels, defineCoughModels } from "../models/db/cough";
import {
  connectorFromSqlSecrets,
  FirebaseReceiver
} from "../external/firebase";
import logger from "../util/logger";
import { requestId } from "../util/expressApp";
import {
  DocumentType,
  SurveyDocument,
  PhotoDocument
} from "audere-lib/dist/coughProtocol";

export class CoughEndpoint {
  private readonly sql: SplitSql;
  private readonly models: CoughModels;

  constructor(sql: SplitSql) {
    this.sql = sql;
    this.models = defineCoughModels(sql);
  }

  public importCoughDocuments = async (req, res, next) => {
    const reqId = requestId(req);
    logger.info(`${reqId}: enter importCoughDocuments`);
    const result = {
      successes: [],
      errors: [],
      timestamp: new Date().toISOString(),
      requestId: reqId
    };
    await this.importSurveys(reqId, result);
    await this.importPhotos(reqId, result);
    logger.info(
      `${reqId}: leave importCoughDocuments\n${JSON.stringify(result, null, 2)}`
    );
    res.json(result);
  };

  private async importSurveys(reqId: string, result: ImportResult) {
    const collection = "surveys";
    const receiver = new FirebaseReceiver(connectorFromSqlSecrets(this.sql), {
      collection
    });
    const updates = await receiver.updates();

    for (let id of updates) {
      const spec = { id, collection };
      await this.wrap(
        reqId,
        spec,
        () => this.importSurvey(receiver, id),
        result
      );
    }
  }

  private async importPhotos(reqId: string, result: ImportResult) {
    const collection = "photos";
    const connector = connectorFromSqlSecrets(this.sql);
    const receiver = new FirebaseReceiver(connector, { collection });
    const updates = await receiver.updates();

    for (let id of updates) {
      const spec = { id, collection };
      await this.wrap(
        reqId,
        spec,
        () => this.importPhoto(receiver, id),
        result
      );
    }
  }

  private async importSurvey(
    receiver: FirebaseReceiver,
    id: string
  ): Promise<void> {
    const snapshot = await receiver.read(id);
    const doc = snapshot.data() as SurveyDocument;
    if (doc.schemaId !== 1 || doc.documentType !== DocumentType.Survey) {
      throw new Error("Unexpected survey document schema");
    }
    await this.models.survey.upsert(doc);
    await receiver.markAsRead(snapshot);
  }

  private async importPhoto(
    receiver: FirebaseReceiver,
    id: string
  ): Promise<void> {
    const snapshot = await receiver.read(id);
    const doc = snapshot.data() as PhotoDocument;
    if (doc.schemaId !== 1 || doc.documentType !== DocumentType.Photo) {
      throw new Error("Unexpected photo document schema");
    }

    const jpegBuffer = await receiver.download(doc.photo.photoId);
    const jpegBase64 = jpegBuffer.toString("base64");

    await this.models.photo.upsert({
      docId: doc.docId,
      device: doc.device,
      photo: {
        timestamp: doc.photo.timestamp,
        photoId: doc.photo.photoId,
        jpegBase64
      }
    });
    await receiver.markAsRead(snapshot);
  }

  private async wrap(
    reqId: string,
    spec: ImportSpec,
    call: () => Promise<void>,
    result: ImportResult
  ) {
    try {
      await call();
      result.successes.push(spec);
    } catch (err) {
      const error = err.message;
      result.errors.push({ ...spec, error });
      logger.error(
        `${reqId} CoughEndpoint import failed for '${spec.id}' in '${
          spec.collection
        }': ${error}`
      );
    }
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
}
