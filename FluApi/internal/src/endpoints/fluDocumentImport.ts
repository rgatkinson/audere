// Copyright (c) 2019 by Audere
//
// Use of this source code is governed by an MIT-style license that
// can be found in the LICENSE file distributed with this file.

import * as AWS from "aws-sdk";
import { SplitSql } from "../util/sql";
import {
  connectorFromSqlSecrets,
  FirebaseReceiver,
} from "../external/firebase";
import {
  booleanQueryParameter,
  jsonKeepAlive,
  requestId,
} from "../util/expressApp";
import {
  getPhotoCollection,
  getSurveyCollection,
  Base64Sample,
  DocumentSnapshot,
  FirebaseDocumentService,
  ImportResult,
  ImportSpec,
  PhotoUploadResult,
} from "../services/firebaseDocumentService";
import { SecretConfig } from "../util/secretsConfig";
import { getS3Config } from "../util/s3Config";
import { S3Uploader } from "../external/s3Uploader";
import { LazyAsync } from "../util/lazyAsync";
import logger from "../util/logger";

export abstract class FluDocumentImport {
  protected readonly sql: SplitSql;
  protected readonly secrets: SecretConfig;
  private s3Uploader: LazyAsync<S3Uploader>;
  private firebaseSurveys: FirebaseReceiver;
  private firebasePhotos: FirebaseReceiver;

  protected abstract photosSecret: string;
  protected abstract writeSurvey: (snapshot: DocumentSnapshot) => Promise<void>;
  protected abstract writePhoto: (
    snapshot: DocumentSnapshot,
    receiver: FirebaseReceiver
  ) => Promise<void>;

  constructor(sql: SplitSql, credentials: string) {
    this.sql = sql;
    this.secrets = new SecretConfig(sql);
    this.s3Uploader = new LazyAsync(async () => {
      const s3Config = await getS3Config(this.secrets);
      const s3 = new AWS.S3({ region: "us-west-2" });
      return new S3Uploader(s3, s3Config);
    });

    this.firebaseSurveys = new FirebaseReceiver(
      connectorFromSqlSecrets(this.sql, credentials),
      { collection: getSurveyCollection() }
    );

    this.firebasePhotos = new FirebaseReceiver(
      connectorFromSqlSecrets(this.sql, credentials),
      { collection: getPhotoCollection() }
    );
  }

  protected async getService(
    progress: () => void
  ): Promise<FirebaseDocumentService> {
    return new FirebaseDocumentService(
      this.firebaseSurveys,
      this.firebasePhotos,
      await this.s3Uploader.get(),
      progress
    );
  }

  public importDocuments = async (req, res, next) => {
    const reqId = requestId(req);
    const markAsRead = booleanQueryParameter(req, "markAsRead", true);
    logger.info(`${reqId}: enter importDocuments`);

    const result = {
      successes: [],
      errors: [],
      timestamp: new Date().toISOString(),
      requestId: reqId,
    };

    const { progress, replyJson } = jsonKeepAlive(res);
    const svc = await this.getService(progress);

    await svc.importDocuments(
      snapshot => this.writeSurvey(snapshot),
      (snapshot, receiver) => this.writePhoto(snapshot, receiver),
      (reqId, spec, err, result) =>
        this.updateImportProblem(reqId, spec, err, result),
      reqId,
      markAsRead,
      result
    );

    await this.updateDerived(progress, reqId);

    replyJson(result);
  };

  public uploadPhotos = async (req, res, next) => {
    const rdtPhotosSecret = await this.secrets.getOrCreate(this.photosSecret);
    const samples = await this.getPhotoSamples();

    const { progress, replyJson } = jsonKeepAlive(res);
    const svc = await this.getService(progress);

    const results = await svc.uploadPhotos(samples, rdtPhotosSecret);
    await this.logPhotoUploadResults(results);

    res.json({
      success: results.filter(result => result !== null).length,
      error: results.filter(result => result === null).length,
    });
  };

  protected abstract getPhotoSamples(): Promise<Base64Sample[]>;

  public updateDerivedTables = async (req, res, next) => {
    const reqId = requestId(req);
    const { progress, replyJson } = jsonKeepAlive(res);
    await this.updateDerived(progress, reqId);
    replyJson({});
  };

  protected abstract logPhotoUploadResults(
    result: PhotoUploadResult[]
  ): Promise<void>;

  protected abstract updateImportProblem(
    reqId: string,
    spec: ImportSpec,
    err: Error,
    result: ImportResult
  ): Promise<number>;

  protected abstract updateDerived(
    progress: () => void,
    reqId: string
  ): Promise<void>;
}
