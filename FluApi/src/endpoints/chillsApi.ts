// Copyright (c) 2019 by Audere
//
// Use of this source code is governed by an MIT-style license that
// can be found in the LICENSE file distributed with this file.

import { Op } from "sequelize";
import { SplitSql } from "../util/sql";
import { ChillsModels, defineChillsModels } from "../models/db/chills";
import { FirebaseReceiver } from "../external/firebase";
import {
  DocumentType,
  SurveyDocument,
  PhotoDocument,
} from "audere-lib/dist/chillsProtocol";
import { ChillsDataPipeline } from "../services/chills/chillsDataPipeline";
import { DataPipelineService } from "../services/data/dataPipelineService";
import { DocumentSnapshot } from "../services/firebaseDocumentService";
import {
  Base64Sample,
  FluDocumentImport,
  PhotoUploadResult,
} from "./fluDocumentImport";
import logger from "../util/logger";

export class ChillsEndpoint extends FluDocumentImport {
  private readonly models: ChillsModels;

  constructor(sql: SplitSql) {
    super(sql, "CHILLS_FIREBASE_TRANSPORT_CREDENTIALS");
    this.models = defineChillsModels(sql);
  }

  protected photosSecret = "CHILLS_RDT_PHOTOS_S3_SECRET";

  protected writeSurvey = async (snapshot: DocumentSnapshot) => {
    const doc = snapshot.data() as SurveyDocument;
    if (doc.schemaId !== 1 || doc.documentType !== DocumentType.Survey) {
      throw new Error("Unexpected survey document schema");
    }
    await this.models.survey.upsert(doc);
  };

  protected writePhoto = async (
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

  protected async getPhotoSamples(): Promise<Base64Sample[]> {
    const surveys = await this.models.survey.findAll({
      where: {
        survey: {
          workflow: {
            surveyCompletedAt: {
              [Op.ne]: null,
            },
          },
        },
        "$photo_upload_log.chills_survey_id$": null,
      },
      include: [
        {
          model: this.models.photoUploadLog,
          required: false,
        },
      ],
    });

    const base64Samples: Base64Sample[] = [];

    for (let i = 0; i < surveys.length; i++) {
      const samples = surveys[i].survey.samples;
      for (let j = 0; j < samples.length; j++) {
        const sample = samples[j];

        if (
          sample.code === "org.iso.Code128" ||
          sample.code === "manualEntry"
        ) {
          let suffix: string;

          switch (sample.sample_type) {
            case "RDTReaderPhotoGUID": {
              suffix = "RDTScan";
              break;
            }
            case "RDTReaderHCPhotoGUID": {
              suffix = "EnhancedScan";
              break;
            }
            case "PhotoGUID": {
              suffix = "ManualPhoto";
              break;
            }
            default: {
              break;
            }
          }

          if (suffix != null) {
            const photoRecord = await this.models.photo.findOne({
              where: {
                docId: sample.code,
              },
            });

            base64Samples.push({
              code: sample.code,
              photo: photoRecord.photo.jpegBase64,
              sampleSuffix: suffix,
            });
          }
        }
      }
    }

    return base64Samples;
  }

  protected async logPhotoUploadResults(
    results: PhotoUploadResult[]
  ): Promise<void> {
    await this.models.photoUploadLog.bulkCreate(
      results.filter(result => result !== null)
    );
  }

  protected async updateDerived(progress: () => void, reqId: string) {
    const pipeline = new ChillsDataPipeline(this.sql.nonPii);
    const service = new DataPipelineService(progress);
    logger.info(`${reqId}: enter updateDerivedTables`);
    try {
      await service.refresh(pipeline);
    } catch (err) {
      logger.error(
        `${reqId} ChillsEndpoint update views error: ${err.message}`
      );
    }
    logger.info(`${reqId}: leave updateDerivedTables`);
  }
}
