// Copyright (c) 2019 by Audere
//
// Use of this source code is governed by an MIT-style license that
// can be found in the LICENSE file distributed with this file.

import * as AWS from "aws-sdk";
import { Op } from "sequelize";
import { SplitSql } from "../util/sql";
import {
  CoughModels,
  defineCoughModels,
  ImportProblemAttributes,
} from "../models/db/cough";
import {
  connectorFromSqlSecrets,
  FirebaseReceiver,
} from "../external/firebase";
import logger from "../util/logger";
import { requestId } from "../util/expressApp";
import {
  DocumentType,
  SurveyDocument,
  SurveyNonPIIInfo,
  PhotoDocument,
} from "audere-lib/dist/coughProtocol";
import { DataPipelineService } from "../services/dataPipelineService";
import { SecretConfig } from "../util/secretsConfig";
import { getS3Config } from "../util/s3Config";
import { S3Uploader } from "../external/s3Uploader";
import { LazyAsync } from "../util/lazyAsync";

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

export function getPhotoCollection() {
  return process.env.FIRESTORE_PHOTO_COLLECTION || DEFAULT_PHOTO_COLLECTION;
}

export class CoughEndpoint {
  private readonly sql: SplitSql;
  private readonly models: CoughModels;
  private readonly secrets: SecretConfig;
  private s3Uploader: LazyAsync<S3Uploader>;

  constructor(sql: SplitSql) {
    this.sql = sql;
    this.models = defineCoughModels(sql);

    this.secrets = new SecretConfig(sql);
    this.s3Uploader = new LazyAsync(async () => {
      const s3Config = await getS3Config(this.secrets);
      const s3 = new AWS.S3({ region: "us-west-2" });
      return new S3Uploader(s3, s3Config);
    });
  }

  public importCoughDocuments = async (req, res, next) => {
    const reqId = requestId(req);
    const markAsRead = booleanQueryParameter(req, "markAsRead", true);
    logger.info(`${reqId}: enter importCoughDocuments`);
    const result = {
      successes: [],
      errors: [],
      timestamp: new Date().toISOString(),
      requestId: reqId,
    };

    const { progress, replyJson } = jsonKeepAlive(res);

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
    await this.updateDerived(progress, reqId);

    replyJson(result);
  };

  public uploadCoughPhotos = async (req, res, next) => {
    const rdtPhotosSecret = await this.secrets.getOrCreate(
      "RDT_PHOTOS_S3_SECRET"
    );
    const surveys = await this.models.survey.findAll({
      where: {
        survey: {
          workflow: {
            surveyCompletedAt: {
              [Op.ne]: null,
            },
          },
        },
        "$photo_upload_log.cough_survey_id$": null,
      },
      include: [
        {
          model: this.models.photoUploadLog,
          required: false,
        },
      ],
    });
    const results = await Promise.all(
      surveys.map(async survey => {
        try {
          await Promise.all([
            this.uploadPhoto(
              survey.survey,
              "RDTReaderPhotoGUID",
              "RDTScan",
              rdtPhotosSecret
            ),
            this.uploadPhoto(
              survey.survey,
              "RDTReaderHCPhotoGUID",
              "EnhancedScan",
              rdtPhotosSecret
            ),
            this.uploadPhoto(
              survey.survey,
              "PhotoGUID",
              "ManualPhoto",
              rdtPhotosSecret
            ),
          ]);
        } catch (e) {
          console.error(e);
          return null;
        }
        return { coughSurveyId: survey.id };
      })
    );
    await this.models.photoUploadLog.bulkCreate(
      results.filter(result => result !== null)
    );
    res.json({
      success: results.filter(result => result !== null).length,
      error: results.filter(result => result === null).length,
    });
  };

  private async uploadPhoto(
    survey: SurveyNonPIIInfo,
    sampleType: string,
    fileSuffix: string,
    rdtPhotosSecret: string
  ): Promise<void> {
    const barcodeSample = survey.samples.find(
      sample =>
        sample.sample_type === "org.iso.Code128" ||
        sample.sample_type === "manualEntry"
    );
    const photoSample = survey.samples.find(
      sample => sample.sample_type === sampleType
    );
    if (!barcodeSample || !photoSample) {
      return;
    }
    const photoRecord = await this.models.photo.findOne({
      where: {
        docId: photoSample.code,
      },
    });
    await (await this.s3Uploader.get()).writeRDTPhoto(
      rdtPhotosSecret,
      "cough",
      `${barcodeSample.code}_${fileSuffix}.png`,
      Buffer.from(photoRecord.photo.jpegBase64, "base64")
    );
  }

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
    const updates = await this.updatesWithRetry(receiver);

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

  // We have seen failure alerts where Firebase fails with an authentication
  // error and then consistently succeeds one minute later.  Since we only ever
  // see failures on the first run after a long idle, this retries in an
  // attempt to debug and potentially work around the issue.
  private async updatesWithRetry(
    receiver: FirebaseReceiver
  ): Promise<string[]> {
    for (let i = 0; i < 5; i++) {
      try {
        return await receiver.updates();
      } catch (err) {
        logger.error(`CoughEndpoint.updatesWithRetry: '${err.message}'`);
      }
      await new Promise(resolve => setTimeout(resolve, 10 * 1000));
    }
    return await receiver.updates();
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
      `${reqId} CoughEndpoint import failed for '${spec.id}' in '${spec.collection}': ${err.message}`
    );

    const firebaseCollection = spec.collection;
    const firebaseId = spec.id;
    const existing = await this.models.importProblem.findOne({
      where: { firebaseCollection, firebaseId },
    });

    const problem = {
      id: existing == null ? undefined : existing.id,
      firebaseCollection,
      firebaseId,
      attempts: existing == null ? 1 : existing.attempts + 1,
      lastError: err.message,
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
        jpegBase64,
      },
    });
  };

  public updateDerivedTables = async (req, res, next) => {
    const reqId = requestId(req);
    const { progress, replyJson } = jsonKeepAlive(res);
    await this.updateDerived(progress, reqId);
    replyJson({});
  };

  private async updateDerived(progress: () => void, reqId: string) {
    const service = new DataPipelineService(this.sql, progress);
    logger.info(`${reqId}: enter updateDerivedTables`);
    try {
      await service.refresh();
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
    attempts: problem.attempts,
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

function jsonKeepAlive(res): KeepAliveJson {
  // Set Content-Type now since headers have to go before body and we start
  // streaming whitespace to keep alive.
  res.type("json");
  // Prevent nginx from buffering the stream so the keep-alive whitespace
  // makes it to the ELB as well.
  res.set("X-Accel-Buffering", "no");

  // Send whitespace regularly during import so ExpressJS, nginx, and ELB
  // don't time out.
  const progress = () => res.write(" ");

  const replyJson = (result: object) => {
    res.write("\n");
    res.write(JSON.stringify(result));
    res.end();
  };

  return { progress, replyJson };
}

interface KeepAliveJson {
  progress: () => void;
  replyJson: (result: object) => void;
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
