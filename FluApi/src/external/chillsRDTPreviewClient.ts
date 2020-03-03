// Copyright (c) 2020 by Audere
//
// Use of this source code is governed by an MIT-style license that
// can be found in the LICENSE file distributed with this file.

import { ChillsModels, defineChillsModels } from "../models/db/chills";
import { SplitSql } from "../util/sql";

export interface RDTPreview {
  docId: string;
  photo: string;
  seriesIndex: number;
  frameIndex: number;
  previewSampleRate: number;
  uiMessage: string;
  failureReason: string;
  photoUploaded: boolean;
  previewPhotoId: string;
  isFocused: boolean;
  isSteady: boolean;
  isCentered: boolean;
  testStripDetected: boolean;
  controlLineFound: boolean;
  testALineFound: boolean;
  testBLineFound: boolean;
  sharpnessRaw: number;
  exposureResult: number;
  phase1Recognitions: string;
  phase2Recognitions: string;
  intermediateResults: string;
  testStripBoundary: string;
}

export interface SeriesPreview {
  docId: string;
  photoId: string;
  seriesIndex: number;
}

/**
 * Client for interacting with Evidation-owned Google sheet for trigger dates.
 */
export class ChillsRDTPreviewClient {
  private readonly models: ChillsModels;
  private readonly sql: SplitSql;

  constructor(sql: SplitSql) {
    this.models = defineChillsModels(sql);
    this.sql = sql;
  }

  public async getRDTPreviewPhotos(): Promise<SeriesPreview[]> {
    const rows = await this.sql.nonPii.query(
      `
        select
          s.docid as docid,
          ss.value as photo,
          ss.ordinality
        from
          chills.current_surveys s,
          jsonb_array_elements_text(s.survey->'previewSeries') with ordinality ss
          left join chills.rdt_preview_frames r on ss.value = r.photo
        where
          ss.value like 'preview_info%'
          and ss.value like '%.json'
          and r.docid is null
        `
    );

    return rows[0].map(row => {
      return {
        docId: row.docid,
        photoId: row.photo,
        seriesIndex: row.ordinality,
      };
    });
  }

  public async getRDTPreviewData(
    preview: SeriesPreview
  ): Promise<RDTPreview[]> {
    const rdtPhoto = await this.models.photo.findOne({
      where: {
        docid: preview.photoId,
      },
    });

    let previewFrames = [];
    const frames = JSON.parse(
      Buffer.from(rdtPhoto.photo.jpegBase64, "base64").toString()
    );
    frames.forEach(frame =>
      previewFrames.push({
        docid: preview.docId,
        photo: preview.photoId,
        seriesIndex: preview.seriesIndex,
        frame,
      })
    );

    const seriesData = previewFrames.map(row => {
      const docId = row.docid;
      const photo = row.photo;
      const seriesIndex = row.seriesIndex;
      const frameIndex = row.frame.previewFrameIndex;
      const previewSampleRate = row.frame.previewSampleRate;
      const uiMessage = row.frame.uiMessage;
      const failureReason = row.frame.failureReason;
      const photoUploaded = row.frame.photoUploaded;
      const previewPhotoId = row.frame.previewPhotoId;
      const isFocused = row.frame.isFocused;
      const isSteady = row.frame.isSteady;
      const isCentered = row.frame.isCentered;
      const testStripDetected = row.frame.testStripDetected;
      const controlLineFound = row.frame.controlLineFound;
      const testALineFound = row.frame.testALineFound;
      const testBLineFound = row.frame.testBLineFound;
      const sharpnessRaw = row.frame.sharpnessRaw;
      const exposureResult = row.frame.exposureResult;
      const phase1Recognitions = row.frame.phase1Recognitions;
      const phase2Recognitions = row.frame.phase2Recognitions;
      const intermediateResults = row.frame.intermediateResults;
      const testStripBoundary = row.frame.testStripBoundary
        ? row.frame.testStripBoundary
            .map(
              coords =>
                `(${parseFloat(coords.x).toFixed(1)}, ${parseFloat(
                  coords.y
                ).toFixed(1)})`
            )
            .toString()
        : row.frame.testStripBoundary;

      return {
        docId,
        photo,
        seriesIndex,
        frameIndex,
        previewSampleRate,
        uiMessage,
        failureReason,
        photoUploaded,
        previewPhotoId,
        isFocused,
        isSteady,
        isCentered,
        testStripDetected,
        controlLineFound,
        testALineFound,
        testBLineFound,
        sharpnessRaw,
        exposureResult,
        phase1Recognitions,
        phase2Recognitions,
        intermediateResults,
        testStripBoundary,
      };
    });

    return seriesData;
  }
}
