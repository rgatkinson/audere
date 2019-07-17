// Copyright (c) 2019 by Audere
//
// Use of this source code is governed by an MIT-style license that
// can be found in the LICENSE file distributed with this file.

import { Sequelize } from "sequelize";
import { SplitSql } from "../util/sql";
import { Hash } from "../util/crypto";
import {
  OptionQuestion,
  SurveyQuestion,
  SurveyQuestionType,
  SURVEY_QUESTIONS
} from "audere-lib/coughQuestionConfig";
import { defineDataNode } from "../models/db/dataPipeline";
import { tuple2 } from "../util/tuple";

const DEBUG_DATA_PIPELINE_SERVICE = false;

export class DataPipelineService {
  private readonly sql: SplitSql;

  constructor(sql: SplitSql) {
    this.sql = sql;
  }

  async refresh(): Promise<void> {
    await this.refreshPipelineNodes(this.sql.pii, getPiiDataNodes());
    await this.refreshPipelineNodes(this.sql.nonPii, getNonPiiDataNodes());
  }

  async refreshFirebase(): Promise<void> {
    await this.refreshPipelineNodes(this.sql.nonPii, getFirebaseDataNodes());
  }

  private async refreshPipelineNodes(
    sql: Sequelize,
    nodes: ManagedSqlNode[]
  ): Promise<void> {
    const nodeState = defineDataNode(sql);
    const states = await nodeState.findAll({});
    const statesByName = new Map(states.map(x => tuple2(x.name, x)));
    const nodesByName = new Map(nodes.map(x => tuple2(x.meta.name, x)));
    const hashes = buildHashes(nodesByName);

    for (let state of states) {
      const name = state.name;
      if (!nodesByName.has(name)) {
        await runQuery(sql, state.cleanup);
        await nodeState.destroy({ where: { name } });
      }
    }

    for (let node of nodes) {
      const name = node.meta.name;
      const state = statesByName.get(name);
      const hash = hashes.get(name);
      if (state != null && state.hash === hash) {
        const refresh = node.getRefresh();
        if (refresh != null) {
          await runQuery(sql, refresh);
        }
      } else {
        const drop = node.getDelete();
        await runQuery(sql, drop);
        await runQuery(sql, node.getCreate());
        await nodeState.upsert({ name, hash, cleanup: drop });
      }
    }
  }
}

// Metadata for how to create some SQL node, e.g. type or view.
interface SqlNodeMetadata {
  name: string;
  deps: string[];
  spec: string; // Specification for how to create.
}

interface ManagedSqlNode {
  readonly meta: SqlNodeMetadata;

  getCreate(): string;
  getRefresh(): string | null;
  getDelete(): string;
}

class ManagedSqlType implements ManagedSqlNode {
  readonly meta: SqlNodeMetadata;
  constructor(meta: SqlNodeMetadata) {
    this.meta = meta;
  }

  getCreate = () => `create type ${this.meta.name} as ${this.meta.spec};`;
  getRefresh = () => null;
  getDelete = () => `drop type if exists ${this.meta.name} cascade;`;
}

class ManagedView implements ManagedSqlNode {
  readonly meta: SqlNodeMetadata;
  constructor(meta: SqlNodeMetadata) {
    this.meta = meta;
  }

  getCreate = () => `create view ${this.meta.name} as ${this.meta.spec};`;
  getRefresh = () => null;
  getDelete = () => dropTableLike(this.meta.name);
}

class ManagedMaterializedView implements ManagedSqlNode {
  readonly meta: SqlNodeMetadata;
  constructor(meta: SqlNodeMetadata) {
    this.meta = meta;
  }

  getCreate = () =>
    `create materialized view ${this.meta.name} as ${this.meta.spec};`;
  getRefresh = () => `refresh materialized view ${this.meta.name};`;
  getDelete = () => dropTableLike(this.meta.name);
}

async function runQuery(sql: Sequelize, query: string): Promise<void> {
  debug(`=== Running SQL ===\n${query}`);
  await sql.query(query);
}

function getPiiDataNodes(): ManagedSqlNode[] {
  return [];
}

function getNonPiiDataNodes(): ManagedSqlNode[] {
  return [
    new ManagedSqlType({
      name: "cough_derived.survey_response",
      deps: [],
      spec: `(
        id text,
        text text,
        answer jsonb,
        "answerOptions" jsonb
      )`
    }),

    new ManagedMaterializedView({
      name: "cough_derived.non_demo_surveys",
      deps: [],
      spec: `
        select * from cough.current_surveys
        where survey->>'isDemo' = 'false'
      `
    }),

    new ManagedMaterializedView({
      name: "cough_derived.survey_named_array_items",
      deps: ["cough_derived.non_demo_surveys"],
      spec: `
        select
          id,
          "createdAt",
          "updatedAt",
          docid,
          device,
          survey,
          ${namedResponseColumns(SURVEY_QUESTIONS).join(",\n  ")},
          ${namedSampleColumns().join(",\n  ")}
        from cough_derived.non_demo_surveys
      `
    }),

    new ManagedMaterializedView({
      name: "cough_derived.surveys",
      deps: [
        "cough_derived.survey_response",
        "cough_derived.survey_named_array_items"
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

          survey,
          survey->'marketingProperties' as marketingproperties,
          survey->'events' as events,
          survey->'pushNotificationState' as pushnotificationstate,
          survey->'workflow' as workflow,
          survey->'gender' as gender,
          survey->'consents' as consents,
          survey->'consents'->0 as consent0,
          survey->'consents'->0->'date' as consent0_date,
          survey->'consents'->0->'terms' as consent0_terms,
          survey->'samples' as samples,
          ${sampleColumns().join(",\n")},
          survey->'invalidBarcodes' as invalidbarcodes,
          survey->'responses'->0->'item' as responses,
          ${answerColumns(SURVEY_QUESTIONS).join(",\n")},
          survey->'rdtInfo' as rdtinfo,
          survey->'rdtInfo'->>'captureTime' as rdtinfo_lastcapturetime,
          survey->'rdtInfo'->>'rdtTotalTime' as rdtinfo_totalcapturetime,
          survey->'rdtInfo'->>'resultShown' as rdtinfo_resultshown,
          survey->'rdtInfo'->>'resultShownExplanation' as rdtinfo_resultshownexplanation,
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
          survey->'rdtInfo'->'rdtReaderResult'->>'testBLineFound' as rdtreaderresult_testblinefound
        from cough_derived.survey_named_array_items
      `
    }),

    new ManagedView({
      name: "cough_derived.aspren_data",
      deps: [],
      spec: `
        select
          id,
          "createdAt",
          "updatedAt",

          barcode,
          encounter_date,
          encounter_state,
          adeno_result,
          b_pertussis_result,
          flu_a_result,
          flu_b_result,
          h1n1_result,
          h3n2_result,
          metapneumovirus_result,
          mycopneumonia_result,
          para_1_result,
          para_2_result,
          para_3_result,
          rhinovirus_result,
          rsv_result,
          victoria_result,
          yamagata_result,
          atsi,
          date_onset,
          current_vaccination,
          vaccination_date,
          previous_vaccination,
          comorbities,
          comorbities_description,
          hcw_status,
          overseas_illness,
          overseas_location
        from cough.aspren_data
      `
    })
  ];
}

function getFirebaseDataNodes(): ManagedSqlNode[] {
  return [
    new ManagedMaterializedView({
      name: "cough_derived.analytics",
      deps: [],
      spec: `
        select
          id,
          "createdAt",
          "updatedAt",

          event->>'event_date' as event_date,
          event->>'event_timestamp' as event_timestamp,
          event->>'event_name' as event_name,
          event->>'event_previous_timestamp' as event_previous_timestamp,
          event->>'event_value_in_usd' as event_value_usd,
          event->>'event_bundle_sequence_id' as event_bundle_sequence_id,
          event->>'event_server_timestamp_offset' as event_server_timestamp_offset,
          event->>'user_id' as user_id,
          event->>'user_pseudo_id' as user_pseudo_id,
          event->>'user_first_touch_timestamp' as user_first_touch_timestamp,
          event->'user_ltv'->>'revenue' as ltv_revenue,
          event->'user_ltv'->>'currency' as ltv_currency,
          event->'device'->>'category' as device_category,
          event->'device'->>'mobile_brand_name' as mobile_brand_name,
          event->'device'->>'mobile_model_name' as mobile_model_name,
          event->'device'->>'mobile_marketing_name' as mobile_marketing_name,
          event->'device'->>'mobile_os_hardware_model' as mobile_os_hardware_model,
          event->'device'->>'operating_system' as device_operating_system,
          event->'device'->>'operating_system_version' as device_operating_system_version,
          event->'device'->>'vendor_id' as device_vendor_id,
          event->'device'->>'advertising_id' as device_advertising_id,
          event->'device'->>'language' as device_language,
          event->'device'->>'is_limited_ad_tracking' as is_limited_ad_tracking,
          event->'device'->>'time_zone_offset_seconds' as device_time_zone_offset_seconds,
          event->'device'->>'browser' as device_browser,
          event->'device'->>'browser_version' as device_browser_version,
          event->'device'->'web_info'->>'browser' as web_info_browser,
          event->'device'->'web_info'->>'browser_version' as web_info_browser_version,
          event->'device'->'web_info'->>'hostname' as web_info_hostname,
          event->'geo'->>'continent' as continent,
          event->'geo'->>'country' as country,
          event->'geo'->>'region' as region,
          event->'geo'->>'city' as city,
          event->'geo'->>'sub_continent' as sub_continent,
          event->'geo'->>'metro' as metro,
          event->'app_info'->>'id' as app_info_id,
          event->'app_info'->>'version' as app_info_version,
          event->'app_info'->>'install_store' as install_store,
          event->'app_info'->>'firebase_app_id' as firebase_app_id,
          event->'app_info'->>'install_source' as install_source,
          event->'traffic_source'->>'name' as traffic_source_name,
          event->'traffic_source'->>'medium' as traffic_source_medium,
          event->'traffic_source'->>'source' as traffic_source,
          event->>'stream_id' as stream_id,
          event->>'platform' as platform,
          event->'event_dimensions'->>'hostname' as hostname
        from cough.firebase_analytics
      `
    }),

    new ManagedMaterializedView({
      name: "cough_derived.analytics_event_params",
      deps: ["cough_derived.analytics"],
      spec: `
        select
          a.id,
          a."createdAt",
          a."updatedAt",

          e->>'key' as key,
          coalesce(e->'value'->>'string_value', e->'value'->>'int_value', e->'value'->>'float_value', e->'value'->>'double_value') as value
        from
          cough.firebase_analytics a,
          jsonb_array_elements(a.event->'event_params') e
      `
    }),

    new ManagedMaterializedView({
      name: "cough_derived.analytics_user_properties",
      deps: ["cough_derived.analytics"],
      spec: `
        select
          a.id,
          a."createdAt",
          a."updatedAt",

          u->>'key' as key,
          coalesce(u->'value'->>'string_value', u->'value'->>'int_value', u->'value'->>'float_value', u->'value'->>'double_value') as value,
          u->'value'->>'set_timestamp_micros' as set_timestamp
        from
          cough.firebase_analytics a,
          jsonb_array_elements(a.event->'user_properties') u
      `
    })
  ];
}

function namedResponseColumns(questions: SurveyQuestion[]): string[] {
  return flatMap(columns, questions);

  function columns(question: SurveyQuestion): string[] {
    return [
      `
        jsonb_extract_path(
          survey->'responses'->0->'item',
          (
            ${selectIndexOfKeyValue(
              `survey->'responses'->0->'item'`,
              "id",
              question.id
            )}
          )::text
        ) as response_${question.id.toLowerCase()}
      `
    ];
  }
}

function namedSampleColumns(): string[] {
  return [
    `
      jsonb_extract_path(
        survey->'samples',
        (${selectIndexOfKeyValue(
          "survey->'samples'",
          "sample_type",
          "manualEntry"
        )})::text
      )->>'code' as samples_manualentry
    `,
    `
      jsonb_extract_path(
        survey->'samples',
        (${selectIndexOfKeyValue(
          "survey->'samples'",
          "sample_type",
          "org.iso.Code128"
        )})::text
      )->>'code' as samples_code128
    `,
    `
      jsonb_extract_path(
        survey->'samples',
        (${selectIndexOfKeyValue(
          "survey->'samples'",
          "sample_type",
          "1"
        )})::text
      )->>'code' as samples_1
    `,
    `
      jsonb_extract_path(
        survey->'samples',
        (${selectIndexOfKeyValue(
          "survey->'samples'",
          "sample_type",
          "PhotoGUID"
        )})::text
      )->>'code' as samples_photoguid
    `,
    `
      jsonb_extract_path(
        survey->'samples',
        (${selectIndexOfKeyValue(
          "survey->'samples'",
          "sample_type",
          "RDTReaderPhotoGUID"
        )})::text
      )->>'code' as samples_rdtreaderphotoguid
    `,
    `
      jsonb_extract_path(
        survey->'samples',
        (${selectIndexOfKeyValue(
          "survey->'samples'",
          "sample_type",
          "RDTReaderHCPhotoGUID"
        )})::text
      )->>'code' as samples_rdtreaderhcphotoguid
    `
  ];
}

function sampleColumns(): string[] {
  return [
    "samples_manualentry",
    "samples_code128",
    "samples_photoguid",
    "samples_rdtreaderphotoguid",
    "samples_rdtreaderhcphotoguid",
    `coalesce(samples_code128, samples_1, samples_manualentry) as samples_barcode`,
    `coalesce(samples_rdtreaderphotoguid, samples_photoguid) as samples_photo`
  ];
}

function answerColumns(questions: SurveyQuestion[]): string[] {
  return flatMap(columns, questions);

  function columns(question: SurveyQuestion): string[] {
    debug(`=== Generating Columns for ===\n${JSON.stringify(question)}`);
    const qid = question.id.toLowerCase();
    switch (question.type) {
      // Text is just a label, and results in no data in db.
      case SurveyQuestionType.Text:
        return [];

      // `.answer` is a string with the data we want
      case SurveyQuestionType.DatePicker:
        return [
          `
          response_${qid}->'answer'->0->>'valueDateTime' as ${qid}
        `
        ];

      case SurveyQuestionType.TextInput:
        return [
          `
          response_${qid}->'answer'->0->>'valueString' as ${qid}
        `
        ];

      case SurveyQuestionType.ButtonGrid:
      case SurveyQuestionType.Dropdown:
      case SurveyQuestionType.RadioGrid:
        // `.answer` is `[{"valueIndex": N}]`, where N is an index into `.answerOptions`.
        // `.answerOptions` is `[{"id":"","text":""},...]
        // So we want to return the id of the selected answer index
        return [
          `
            jsonb_extract_path(
              response_${qid}->'answerOptions',
              response_${qid}->'answer'->0->>'valueIndex'
            )->>'id' as ${qid}
          `
        ];

      case SurveyQuestionType.OptionQuestion: {
        const optionQuestion = question as OptionQuestion;

        // `.answer` is `{"valueIndex": N0, "valueIndex": N1}`, where N0,N1 are indexes
        // into `.answerOptions`.
        // `.answerOptions` is `[{"id":"","text":""},...]
        // So we want to return a yes/no answer for each `.answerOption`
        // select answer @> '[{"valueIndex":${i}}]'::jsonb
        return optionQuestion.options.map(
          (option, i) => `
          (
            select (
              ${selectIndexOfKeyValue(
                `response_${qid}->'answerOptions'`,
                "id",
                option,
                `response_${qid}->'answer' @> ('[{"valueIndex":' || index || '}]')::jsonb`
              )}
            )
            is not null
          )
          as ${qid}_${option.toLowerCase()}
        `
        );
      }

      default:
        throw new Error(`Unexpected SurveyQuestionType: ${question.type}`);
    }
  }
}

function selectIndexOfKeyValue(
  array: string,
  key: string,
  value: string,
  cond?: string
): string {
  return `
    select * from generate_series(0, jsonb_array_length(${array})-1) as index
      where jsonb_extract_path(${array}, index::text)->>'${key}' = '${value}'${
    cond
      ? `
        and ${cond}
      `
      : ""
  }

  `;
}

// We drop table, view, or materialized view to handle cases where
// we change the type.
function dropTableLike(fullName: string) {
  const dotIndex = fullName.indexOf(".");
  const name = fullName.substring(dotIndex + 1);
  const schema = dotIndex < 0 ? "public" : fullName.substring(0, dotIndex);

  return `
    do $$ begin
      ${drop(name, schema, "table", "table")};
      ${drop(name, schema, "view", "view")};
      ${drop(name, schema, "matview", "materialized view")};
    end $$
  `;

  function drop(name: string, schema: string, pgShort: string, pgFull: string) {
    return `
      if exists (
        select * from pg_${pgShort}s
        where schemaname='${schema}' and ${pgShort}name='${name}'
      ) then
        drop ${pgFull} if exists ${schema}.${name} cascade;
      end if
    `;
  }
}

// Assumes Map.values() returns nodes in insertion order
function buildHashes(nodesByName: Map<string, ManagedSqlNode>) {
  const hashes = new Map();
  for (let node of nodesByName.values()) {
    const hash = new Hash();
    hash.update(node.getCreate());
    hash.update(node.getRefresh());
    hash.update(node.getDelete());
    node.meta.deps.forEach(name => hash.update(hashes.get(name)));
    hashes.set(node.meta.name, hash.toString());
  }
  return hashes;
}

function flatMap<I, O>(f: (input: I) => O[], inputs: I[]): O[] {
  return inputs.reduce((acc, x) => [...acc, ...f(x)], []);
}

function debug(s: string) {
  if (DEBUG_DATA_PIPELINE_SERVICE) {
    console.log(`DataPipelineService: ${s}`);
  }
}
