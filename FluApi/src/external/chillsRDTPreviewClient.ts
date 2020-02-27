// Copyright (c) 2020 by Audere
//
// Use of this source code is governed by an MIT-style license that
// can be found in the LICENSE file distributed with this file.

import { ChillsModels, defineChillsModels } from "../models/db/chills";
import { SplitSql } from "../util/sql";

export interface RDTPreview {
  docId: string;
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

  public async getRDTPreviewData(): Promise<RDTPreview[]> {
    const surveys_with_rdt_previews = await this.models.survey
      .findAll()
      .filter(survey => typeof survey.survey.previewSeries !== "undefined");
    const rdt_photos = await this.models.photo.findAll();

    const preview_frames = [];
    surveys_with_rdt_previews.forEach(survey => {
      const docid = survey.docId;

      // go through each capture attempt recorded in the survey, find the associated
      // photo in storage, and process the frame data
      for (
        let series_index = 0;
        series_index < survey.survey.previewSeries.length;
        series_index++
      ) {
        const series = rdt_photos.find(
          photo =>
            photo.photo.photoId === survey.survey.previewSeries[series_index] &&
            photo.photo.photoId.slice(0, 12) === "preview_info"
        );
        if (series) {
          const frames = JSON.parse(
            Buffer.from(series.photo.jpegBase64, "base64").toString()
          );
          frames.forEach(frame =>
            preview_frames.push({ docid, series_index, frame })
          );
        }
      }
    });

    const rdt_preview_series_data = preview_frames.map(row => {
      const docId = row.docid;
      const seriesIndex = row.series_index;
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

    return rdt_preview_series_data;
  }
}
