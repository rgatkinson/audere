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
  DocumentSnapshot,
  FirebaseDocumentService,
} from "../services/firebaseDocumentService";
import { SecretConfig } from "../util/secretsConfig";
import { getS3Config } from "../util/s3Config";
import { S3Uploader } from "../external/s3Uploader";
import { LazyAsync } from "../util/lazyAsync";
import logger from "../util/logger";

const DEFAULT_SURVEY_COLLECTION = "surveys";
const DEFAULT_PHOTO_COLLECTION = "photos";

export function getSurveyCollection(): string {
  return process.env.FIRESTORE_SURVEY_COLLECTION || DEFAULT_SURVEY_COLLECTION;
}

export function getPhotoCollection(): string {
  return process.env.FIRESTORE_PHOTO_COLLECTION || DEFAULT_PHOTO_COLLECTION;
}

export abstract class FluDocumentImport extends FirebaseDocumentService {
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
    super();

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

    await this.importItems(
      reqId,
      markAsRead,
      getSurveyCollection(),
      this.writeSurvey,
      this.firebaseSurveys,
      result,
      progress
    );
    await this.importItems(
      reqId,
      markAsRead,
      getPhotoCollection(),
      this.writePhoto,
      this.firebasePhotos,
      result,
      progress
    );
    logger.info(
      `${reqId}: leave importDocuments\n${JSON.stringify(result, null, 2)}`
    );

    await this.updateDerived(progress, reqId);

    replyJson(result);
  };

  public updateDerivedTables = async (req, res, next) => {
    const reqId = requestId(req);
    const { progress, replyJson } = jsonKeepAlive(res);
    await this.updateDerived(progress, reqId);
    replyJson({});
  };

  public uploadPhotos = async (req, res, next) => {
    const rdtPhotosSecret = await this.secrets.getOrCreate(this.photosSecret);
    const samples = await this.getPhotoSamples();

    const results = await Promise.all(
      samples.map(async sample => {
        try {
          await this.uploadPhoto(sample, rdtPhotosSecret);
        } catch (e) {
          console.error(e);
          return null;
        }
        return { surveyId: sample.code };
      })
    );
    await this.logPhotoUploadResults(results);

    res.json({
      success: results.filter(result => result !== null).length,
      error: results.filter(result => result === null).length,
    });
  };

  private async uploadPhoto(
    sample: Base64Sample,
    rdtPhotosSecret: string
  ): Promise<void> {
    const svc = await this.s3Uploader.get();
    await svc.writeRDTPhoto(
      rdtPhotosSecret,
      "cough",
      `${sample.code}_${sample.sampleSuffix}.png`,
      Buffer.from(sample.photo, "base64")
    );
  }

  protected abstract getPhotoSamples(): Promise<Base64Sample[]>;

  protected abstract logPhotoUploadResults(
    result: PhotoUploadResult[]
  ): Promise<void>;

  protected abstract updateDerived(
    progress: () => void,
    reqId: string
  ): Promise<void>;
}

export interface Base64Sample {
  code: string;
  photo: string;
  sampleSuffix: string;
}

export interface PhotoUploadResult {
  surveyId: string;
}
