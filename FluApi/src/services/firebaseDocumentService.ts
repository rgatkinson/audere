// Copyright (c) 2019 by Audere
//
// Use of this source code is governed by an MIT-style license that
// can be found in the LICENSE file distributed with this file.

import { FirebaseReceiver } from "../external/firebase";
import { S3Uploader } from "../external/s3Uploader";
import logger from "../util/logger";

export type DocumentSnapshot = FirebaseFirestore.DocumentSnapshot;

// We import every hour, try importing for up to one day before giving up.
const MAX_IMPORT_ATTEMPTS = 24;

const DEFAULT_SURVEY_COLLECTION = "surveys";
const DEFAULT_PHOTO_COLLECTION = "photos";

export function getSurveyCollection(): string {
  return process.env.FIRESTORE_SURVEY_COLLECTION || DEFAULT_SURVEY_COLLECTION;
}

export function getPhotoCollection(): string {
  return process.env.FIRESTORE_PHOTO_COLLECTION || DEFAULT_PHOTO_COLLECTION;
}

export class FirebaseDocumentService {
  private readonly firebaseSurveys: FirebaseReceiver;
  private readonly firebasePhotos: FirebaseReceiver;
  private readonly s3Uploader: S3Uploader;
  private readonly progress: () => void;

  constructor(
    firebaseSurveys: FirebaseReceiver,
    firebasePhotos: FirebaseReceiver,
    s3Uploader: S3Uploader,
    progress: () => void
  ) {
    this.firebaseSurveys = firebaseSurveys;
    this.firebasePhotos = firebasePhotos;
    this.s3Uploader = s3Uploader;
    this.progress = progress;
  }

  public async importDocuments(
    writeSurvey: (
      snapshot: DocumentSnapshot,
      receiver: FirebaseReceiver
    ) => Promise<void>,
    writePhoto: (
      snapshot: DocumentSnapshot,
      receiver: FirebaseReceiver
    ) => Promise<void>,
    updateImportProblem: (
      reqId: string,
      spec: ImportSpec,
      err: Error,
      result: ImportResult
    ) => Promise<number>,
    reqId: string,
    markAsRead: boolean,
    result: ImportResult
  ): Promise<ImportResult> {
    logger.info(`${reqId}: enter importDocuments`);

    await this.importItems(
      this.progress,
      reqId,
      markAsRead,
      getSurveyCollection(),
      writeSurvey,
      updateImportProblem,
      this.firebaseSurveys,
      result
    );
    await this.importItems(
      this.progress,
      reqId,
      markAsRead,
      getPhotoCollection(),
      writePhoto,
      updateImportProblem,
      this.firebasePhotos,
      result
    );
    logger.info(
      `${reqId}: leave importDocuments\n${JSON.stringify(result, null, 2)}`
    );

    return result;
  }

  public async uploadPhotos(
    base64samples: Base64Sample[],
    rdtPhotosSecret: string
  ): Promise<PhotoUploadResult[]> {
    const results = await Promise.all(
      base64samples.map(async sample => {
        try {
          await this.uploadPhoto(sample, rdtPhotosSecret);
        } catch (e) {
          console.error(e);
          return null;
        }
        return { surveyId: sample.code };
      })
    );

    return results;
  }

  private async uploadPhoto(
    sample: Base64Sample,
    rdtPhotosSecret: string
  ): Promise<void> {
    await this.s3Uploader.writeRDTPhoto(
      rdtPhotosSecret,
      "cough",
      `${sample.code}_${sample.sampleSuffix}.png`,
      Buffer.from(sample.photo, "base64")
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
    updateImportProblem: (
      reqId: string,
      spec: ImportSpec,
      err: Error,
      result: ImportResult
    ) => Promise<number>,
    firebase: FirebaseReceiver,
    result: ImportResult
  ) {
    const updates = await this.updatesWithRetry(firebase);

    for (let id of updates) {
      const spec = { id, collection };
      let snapshot: DocumentSnapshot;

      try {
        snapshot = await firebase.read(spec.id);
      } catch (err) {
        await updateImportProblem(reqId, spec, err, result);
      }

      if (snapshot != null) {
        try {
          await write(snapshot, firebase);
          if (markAsRead) {
            await firebase.markAsRead(snapshot);
          }
          result.successes.push(spec);
        } catch (err) {
          const attempts = await updateImportProblem(reqId, spec, err, result);
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
}

export interface Base64Sample {
  code: string;
  photo: string;
  sampleSuffix: string;
}

export interface PhotoUploadResult {
  surveyId: string;
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
