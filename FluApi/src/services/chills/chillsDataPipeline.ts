// Copyright (c) 2019 by Audere
//
// Use of this source code is governed by an MIT-style license that
// can be found in the LICENSE file distributed with this file.

import {
  DataPipeline,
  ManagedMaterializedView,
  ManagedSqlNode,
  ManagedSqlType,
  ManagedView,
} from "../data/dataPipeline";
import {
  answerColumns,
  namedResponseColumns,
  namedSampleColumns,
  sampleColumns,
} from "../data/fluPipelineUtils";
import { SURVEY_QUESTIONS } from "audere-lib/chillsQuestionConfig";
import { getFirebaseDataNodes } from "../data/firebasePipelineNodes";
import { Sequelize } from "sequelize";

export class ChillsDataPipeline implements DataPipeline {
  public readonly name: string;
  public readonly db: Sequelize;
  public readonly nodes: ManagedSqlNode[];

  constructor(sql: Sequelize) {
    this.name = "chills_pipeline";
    this.db = sql;
    let nodes = [];
    nodes = nodes.concat(getNonPiiDataNodes());
    nodes = nodes.concat(getFirebaseDataNodes("chills", "chills_derived"));
    this.nodes = nodes;
  }
}

function getNonPiiDataNodes(): ManagedSqlNode[] {
  return [
    new ManagedSqlType({
      name: "chills_derived.survey_response",
      deps: [],
      spec: `(
        id text,
        text text,
        answer jsonb,
        "answerOptions" jsonb
      )`,
    }),

    new ManagedMaterializedView({
      name: "chills_derived.non_demo_surveys",
      deps: [],
      spec: `
        select chills.current_surveys.*, chills.expert_read.interpretation as expert_interpretation from
          chills.current_surveys
          left join chills.expert_read on chills.current_surveys.id = chills.expert_read."surveyId"
        where survey->>'isDemo' = 'false'
      `,
    }),

    new ManagedMaterializedView({
      name: "chills_derived.survey_named_array_items",
      deps: ["chills_derived.non_demo_surveys"],
      spec: `
        select
          id,
          "createdAt",
          "updatedAt",
          docid,
          device,
          survey,
          ${namedResponseColumns(SURVEY_QUESTIONS).join(",\n  ")},
          ${namedSampleColumns().join(",\n  ")},
          expert_interpretation
        from chills_derived.non_demo_surveys
      `,
    }),

    new ManagedMaterializedView({
      name: "chills_derived.surveys",
      deps: [
        "chills_derived.survey_response",
        "chills_derived.survey_named_array_items",
      ],
      spec: `
        select
          id,
          "createdAt",
          "updatedAt",
          docid,

          device,
          device->'platform' as platform,
          device->'platform'->'ios' as platform_ios,
          device->'platform'->'android' as platform_android,
          device->>'idiomText' as idiomtext,
          device->>'yearClass' as yearclass,
          device->>'clientBuild' as clientbuild,
          device->>'installation' as installation,
          device->'clientVersion' as clientversion,
          device->'clientVersion'->>'hash' as clientversion_hash,
          device->'clientVersion'->>'name' as clientversion_name,
          device->'clientVersion'->>'version' as clientversion_version,
          device->'clientVersion'->>'buildDate' as clientversion_builddate,
          device->'clientVersion'->>'rdtVersionAndroid' as clientversion_rdt_android,
          device->'clientVersion'->>'rdtVersionIos' as clientversion_rdt_ios,

          survey,
          survey->'marketingProperties' as marketingproperties,
          survey->'events' as events,
          survey->'pushNotificationState' as pushnotificationstate,
          survey->'workflow' as workflow,
          survey->'gender' as gender,
          survey->'samples' as samples,
          ${sampleColumns().join(",\n")},
          survey->'invalidBarcodes' as invalidbarcodes,
          survey->'responses'->0->'item' as responses,
          ${answerColumns(SURVEY_QUESTIONS).join(",\n")},
          survey->'rdtInfo' as rdtinfo,
          survey->'rdtInfo'->>'captureTime' as rdtinfo_lastcapturetime,
          survey->'rdtInfo'->>'rdtTotalTime' as rdtinfo_totalcapturetime,
          survey->'rdtInfo'->>'flashEnabled' as rdtinfo_flashenabled,
          survey->'rdtInfo'->>'flashDisabledAutomatically' as rdtinfo_flashdisabledautomatically,
          survey->'rdtInfo'->'rdtReaderResult'->>'testStripFound' as rdtreaderresult_teststripfound,
          survey->'rdtInfo'->'rdtReaderResult'->>'skippedDueToMemWarning' as rdtreaderresult_skippedduetomemwarning,
          survey->'rdtInfo'->'rdtReaderResult'->>'isCentered' as rdtreaderresult_iscentered,
          survey->'rdtInfo'->'rdtReaderResult'->>'sizeResult' as rdtreaderresult_sizeresult,
          survey->'rdtInfo'->'rdtReaderResult'->>'isFocused' as rdtreaderresult_isfocused,
          survey->'rdtInfo'->'rdtReaderResult'->>'angle' as rdtreaderresult_angle,
          survey->'rdtInfo'->'rdtReaderResult'->>'isRightOrientation' as rdtreaderresult_isrightorientation,
          survey->'rdtInfo'->'rdtReaderResult'->>'exposureResult' as rdtreaderresult_exposureresult,
          survey->'rdtInfo'->'rdtReaderResult'->>'controlLineFound' as rdtreaderresult_controllinefound,
          survey->'rdtInfo'->'rdtReaderResult'->>'testALineFound' as rdtreaderresult_testalinefound,
          survey->'rdtInfo'->'rdtReaderResult'->>'testBLineFound' as rdtreaderresult_testblinefound,
          survey->'rdtInfo'->'rdtReaderResult'->>'testStripBoundary' as rdtreaderresult_teststripboundary,
          expert_interpretation
        from chills_derived.survey_named_array_items
      `,
    }),

    new ManagedView({
      name: "chills_derived.config",
      deps: [],
      spec: `
        select
          id,
          "createdAt",
          "updatedAt",
          key,
          value
        from config
        where project = 'chills'
      `,
    }),
  ];
}
