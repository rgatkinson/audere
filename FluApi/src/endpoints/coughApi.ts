// Copyright (c) 2019 by Audere
//
// Use of this source code is governed by an MIT-style license that
// can be found in the LICENSE file distributed with this file.

import { SplitSql } from "../util/sql";
import {
  CoughModels,
  defineCoughModels,
  ImportProblemAttributes
} from "../models/db/cough";
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
import { DerivedTableService } from "../services/derivedTableService";

type DocumentSnapshot = FirebaseFirestore.DocumentSnapshot;

const SECOND_MS = 1000;
const MINUTE_MS = 60 * SECOND_MS;

// We import every hour, try importing for up to one day before giving up.
const MAX_IMPORT_ATTEMPTS = 24;

const DEFAULT_SURVEY_COLLECTION = "surveys";
const DEFAULT_PHOTO_COLLECTION = "photos";

function getSurveyCollection() {
  return process.env.FIRESTORE_SURVEY_COLLECTION || DEFAULT_SURVEY_COLLECTION;
}

function getPhotoCollection() {
  return process.env.FIRESTORE_PHOTO_COLLECTION || DEFAULT_PHOTO_COLLECTION;
}

export class CoughEndpoint {
  private readonly sql: SplitSql;
  private readonly models: CoughModels;

  constructor(sql: SplitSql) {
    this.sql = sql;
    this.models = defineCoughModels(sql);
  }

  public importCoughDocuments = async (req, res, next) => {
    const reqId = requestId(req);
    const markAsRead = booleanQueryParameter(req, "markAsRead", true);
    logger.info(`${reqId}: enter importCoughDocuments`);
    const result = {
      successes: [],
      errors: [],
      timestamp: new Date().toISOString(),
      requestId: reqId
    };

    const timeout = 20 * MINUTE_MS;
    req.setTimeout(timeout, res.json({ ...result, timeout }));
    // Send whitespace regularly during import so nginx and ELB don't time out.
    const progress = () => res.write(" ");

    await this.importItems(
      progress,
      reqId,
      markAsRead,
      getSurveyCollection(),
      this.writeSurvey,
      result
    );
    await this.importItems(
      progress,
      reqId,
      markAsRead,
      getPhotoCollection(),
      this.writePhoto,
      result
    );
    logger.info(
      `${reqId}: leave importCoughDocuments\n${JSON.stringify(result, null, 2)}`
    );
    await this.updateDerived(reqId);
    res.write("\n");
    res.json(result);
  };

  private async importItems(
    progress: () => void,
    reqId: string,
    markAsRead: boolean,
    collection: string,
    write: (
      snapshot: DocumentSnapshot,
      receiver: FirebaseReceiver
    ) => Promise<void>,
    result: ImportResult
  ) {
    const connector = connectorFromSqlSecrets(this.sql);
    const receiver = new FirebaseReceiver(connector, { collection });
    const updates = await receiver.updates();

    for (let id of updates) {
      const spec = { id, collection };

      const snapshot = await this.readSnapshot(reqId, receiver, spec, result);
      if (snapshot != null) {
        try {
          await write(snapshot, receiver);
          if (markAsRead) {
            await receiver.markAsRead(snapshot);
          }
          result.successes.push(spec);
        } catch (err) {
          const problem = await this.updateImportProblem(
            reqId,
            spec,
            err,
            result
          );
          if (markAsRead && problem.attempts >= MAX_IMPORT_ATTEMPTS) {
            await receiver.markAsRead(snapshot);
          }
        }
      }
      progress();
    }
  }

  private async readSnapshot(
    reqId: string,
    receiver: FirebaseReceiver,
    spec: ImportSpec,
    result: ImportResult
  ): Promise<DocumentSnapshot | undefined> {
    try {
      return await receiver.read(spec.id);
    } catch (err) {
      await this.updateImportProblem(reqId, spec, err, result);
    }
  }

  private async updateImportProblem(
    reqId: string,
    spec: ImportSpec,
    err: Error,
    result: ImportResult
  ): Promise<ImportProblemAttributes> {
    logger.error(
      `${reqId} CoughEndpoint import failed for '${spec.id}' in '${
        spec.collection
      }': ${err.message}`
    );

    const firebaseCollection = spec.collection;
    const firebaseId = spec.id;
    const existing = await this.models.importProblem.findOne({
      where: { firebaseCollection, firebaseId }
    });

    const problem = {
      id: existing == null ? undefined : existing.id,
      firebaseCollection,
      firebaseId,
      attempts: existing == null ? 1 : existing.attempts + 1,
      lastError: err.message
    };
    result.errors.push(asImportError(problem));
    await this.models.importProblem.upsert(problem);
    return problem;
  }

  private writeSurvey = async (snapshot: DocumentSnapshot) => {
    const doc = snapshot.data() as SurveyDocument;
    if (doc.schemaId !== 1 || doc.documentType !== DocumentType.Survey) {
      throw new Error("Unexpected survey document schema");
    }
    await this.models.survey.upsert(doc);
  };

  private writePhoto = async (
    snapshot: DocumentSnapshot,
    receiver: FirebaseReceiver
  ) => {
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
  };

  public updateDerivedTables = async (req, res, next) => {
    const reqId = requestId(req);
    await this.updateDerived(reqId);
    res.json({});
  };

  private async updateDerived(reqId: string) {
    const service = new DerivedTableService(this.sql);
    logger.info(`${reqId}: enter updateDerivedTables`);
    try {
      await service.update();
    } catch (err) {
      logger.error(`${reqId} CoughEndpoint update views error: ${err.message}`);
    }
    logger.info(`${reqId}: leave updateDerivedTables`);
  }
}

function asImportError(problem: ImportProblemAttributes): ImportError {
  return {
    collection: problem.firebaseCollection,
    id: problem.firebaseId,
    error: problem.lastError,
    attempts: problem.attempts
  };
}

function booleanQueryParameter(req, name: string, dflt: boolean): boolean {
  switch (req.query[name]) {
    case "true":
      return true;
    case "false":
      return false;
    default:
      return dflt;
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
