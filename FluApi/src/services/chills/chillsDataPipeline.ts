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
          c.id,
          c."createdAt",
          c."updatedAt",
          c.docid,

          c.device,
          c.device->'platform' as platform,
          c.device->'platform'->'ios' as platform_ios,
          c.device->'platform'->'android' as platform_android,
          c.device->>'idiomText' as idiomtext,
          c.device->>'yearClass' as yearclass,
          c.device->>'clientBuild' as clientbuild,
          c.device->>'installation' as installation,
          c.device->'clientVersion' as clientversion,
          c.device->'clientVersion'->>'hash' as clientversion_hash,
          c.device->'clientVersion'->>'name' as clientversion_name,
          c.device->'clientVersion'->>'version' as clientversion_version,
          c.device->'clientVersion'->>'buildDate' as clientversion_builddate,

          c.survey,
          c.survey->'marketingProperties' as marketingproperties,
          c.survey->'events' as events,
          c.survey->'pushNotificationState' as pushnotificationstate,
          c.survey->'workflow' as workflow,
          c.survey->'gender' as gender,
          c.survey->'samples' as samples,
          ${sampleColumns("c.").join(",\n")},
          c.survey->'invalidBarcodes' as invalidbarcodes,
          c.survey->'responses'->0->'item' as responses,
          ${answerColumns(SURVEY_QUESTIONS, "c.").join(",\n")},
          c.survey->'rdtInfo' as rdtinfo,
          c.survey->'rdtInfo'->>'captureTime' as rdtinfo_lastcapturetime,
          c.survey->'rdtInfo'->>'rdtTotalTime' as rdtinfo_totalcapturetime,
          c.survey->'rdtInfo'->>'flashEnabled' as rdtinfo_flashenabled,
          c.survey->'rdtInfo'->>'legacyCameraApi' as rdtinfo_legacycameraapi,
          c.survey->'rdtInfo'->'rdtReaderResult'->>'testStripDetected' as rdtreaderresult_teststripdetected,
          c.survey->'rdtInfo'->'rdtReaderResult'->>'skippedDueToMemWarning' as rdtreaderresult_skippedduetomemwarning,
          c.survey->'rdtInfo'->'rdtReaderResult'->>'isCentered' as rdtreaderresult_iscentered,
          c.survey->'rdtInfo'->'rdtReaderResult'->>'isFocused' as rdtreaderresult_isfocused,
          c.survey->'rdtInfo'->'rdtReaderResult'->>'isSteady' as rdtreaderresult_issteady,
          c.survey->'rdtInfo'->'rdtReaderResult'->>'exposureResult' as rdtreaderresult_exposureresult,
          c.survey->'rdtInfo'->'rdtReaderResult'->>'controlLineFound' as rdtreaderresult_controllinefound,
          c.survey->'rdtInfo'->'rdtReaderResult'->>'testALineFound' as rdtreaderresult_testalinefound,
          c.survey->'rdtInfo'->'rdtReaderResult'->>'testBLineFound' as rdtreaderresult_testblinefound,
          c.survey->'rdtInfo'->'rdtReaderResult'->>'testStripBoundary' as rdtreaderresult_teststripboundary,
          c.survey->'rdtInfo'->'rdtReaderResult'->>'intermediateResults' as rdtreaderresult_intermediateresults,
          c.survey->'rdtInfo'->'rdtReaderResult'->>'phase1Recognitions' as rdtreaderresult_phase1recognitions,
          c.survey->'rdtInfo'->'rdtReaderResult'->>'phase1Recognitions' as rdtreaderresult_phase2recognitions,
          c.expert_interpretation,

          s.evidation_id,
          s.email,
          s.birthdate,
          s.sex,
          s.city,
          s.state,
          s.postal_code,
          s.ordered_at
        from
          chills_derived.survey_named_array_items c
          left join chills.matched_kits m on coalesce(c.samples_code128, c.samples_code39, c.samples_1, c.samples_2, c.samples_manualentry) = m.barcode and c.docid ilike m.identifier || '%' and m.id = (select max(id) from chills.matched_kits mm where mm.identifier = m.identifier and mm.barcode = m.barcode)
          left join chills.shipped_kits s on m.barcode = s.barcode and s.demo = false
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
