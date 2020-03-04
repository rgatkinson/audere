// Copyright (c) 2020 by Audere
//
// Use of this source code is governed by an MIT-style license that
// can be found in the LICENSE file distributed with this file.

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
import {
  CovidModels,
  SurveyAttributes,
  defineCovidModels,
  WorkflowEventAttributes,
} from "../models/db/covid";
import { CovidDataPipeline } from "../services/covid/covidDataPipeline";
import { DataPipelineService } from "../services/data/dataPipelineService";
import logger from "../util/logger";

const DEFAULT_SURVEY_COLLECTION = "surveys";
const DEFAULT_WORKFLOW_COLLECTION = "workflow_events";

export function getSurveyCollection(): string {
  return DEFAULT_SURVEY_COLLECTION;
}

export function getWorkflowCollection(): string {
  return DEFAULT_WORKFLOW_COLLECTION;
}

export class CovidEndpoint extends FirebaseDocumentService {
  private readonly models: CovidModels;
  private readonly sql: SplitSql;
  private firebaseSurveys: FirebaseReceiver;
  private firebaseWorkflowEvents: FirebaseReceiver;

  constructor(sql: SplitSql) {
    super();
    const credentials = "COVID_FIREBASE_TRANSPORT_CREDENTIALS";

    this.firebaseSurveys = new FirebaseReceiver(
      connectorFromSqlSecrets(sql, credentials),
      { collection: getSurveyCollection() }
    );

    this.firebaseWorkflowEvents = new FirebaseReceiver(
      connectorFromSqlSecrets(sql, credentials),
      { collection: getWorkflowCollection() }
    );

    this.models = defineCovidModels(sql);
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
      getWorkflowCollection(),
      this.writeWorkflowEvent,
      this.firebaseWorkflowEvents,
      result,
      progress
    );
    logger.info(
      `${reqId}: leave importDocuments\n${JSON.stringify(result, null, 2)}`
    );

    await this.updateDerived(progress, reqId);

    replyJson(result);
  };

  private writeSurvey = async (snapshot: DocumentSnapshot) => {
    const doc = snapshot.data() as SurveyAttributes;
    await this.models.survey.upsert(doc);
  };

  private writeWorkflowEvent = async (snapshot: DocumentSnapshot) => {
    const doc = snapshot.data() as WorkflowEventAttributes;
    await this.models.workflowEvents.upsert(doc);
  };

  protected async updateDerived(progress: () => void, reqId: string) {
    const pipeline = new CovidDataPipeline(this.sql.nonPii);
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
