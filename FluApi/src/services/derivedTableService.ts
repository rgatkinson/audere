// Copyright (c) 2019 by Audere
//
// Use of this source code is governed by an MIT-style license that
// can be found in the LICENSE file distributed with this file.

import { Sequelize } from "sequelize";
import { SplitSql } from "../util/sql";
import {
  OptionQuestion,
  SurveyQuestion,
  SurveyQuestionType,
  SURVEY_QUESTIONS
} from "audere-lib/coughQuestionConfig";

const DEBUG_DERIVED_TABLE_SERVICE = false;

export class DerivedTableService {
  private readonly sql: SplitSql;

  constructor(sql: SplitSql) {
    this.sql = sql;
  }

  public async update(): Promise<void> {
    const types = getTypesMetadata();
    const views = getViewsMetadata();

    // Because things depend on each other, we have to remove things in
    // the opposite order that we created them.
    for (let metadata of [...views].reverse()) {
      await drop(this.sql.pii, metadata, "view");
      await drop(this.sql.nonPii, metadata, "view");
    }
    for (let metadata of [...types].reverse()) {
      await drop(this.sql.pii, metadata, "type");
      await drop(this.sql.nonPii, metadata, "type");
    }

    for (let command of types) {
      await createType(this.sql.pii, command, command.pii);
      await createType(this.sql.nonPii, command, command.nonPii);
    }
    for (let command of getViewsMetadata()) {
      await createView(this.sql.pii, command, command.pii);
      await createView(this.sql.nonPii, command, command.nonPii);
    }
  }
}

async function drop(sql: Sequelize, meta: SqlObjectMetadata, noun: string): Promise<void> {
  const name = scopedName(meta);
  await runQuery(sql, `drop ${noun} if exists ${name}`);
}

async function createType(sql: Sequelize, meta: SqlObjectMetadata, spec?: string): Promise<void> {
  const name = scopedName(meta);
  if (spec != null) {
    await runQuery(sql, `create type ${name} as ${spec};`);
  }
}
async function createView(sql: Sequelize, meta: SqlObjectMetadata, query?: string): Promise<void> {
  const name = scopedName(meta);
  if (query != null) {
    await runQuery(sql, `create view ${name} as ${query};`);
  }
}

async function runQuery(sql: Sequelize, query: string): Promise<void> {
  debug(`=== Running SQL ===\n${query}`);
  await sql.query(query);
}

function scopedName(meta: SqlObjectMetadata): string {
  return meta.schema == null ? meta.name : `${meta.schema}.${meta.name}`;
}

// Metadata for how to create some SQL object, e.g. type or view.
interface SqlObjectMetadata {
  schema?: string; // Typically `derivedSchema(original)`.
  name: string;
  pii?: string;    // Command to create in pii database, if applicable.
  nonPii?: string; // Command to create in non-pii database, if applicable.
}

function getTypesMetadata(): SqlObjectMetadata[] {
  return [
    {
      schema: derivedSchema("cough"),
      name: "survey_response",
      nonPii: `(
        id text,
        text text,
        answer jsonb,
        "answerOptions" jsonb
      )`
    }
  ];
}

// Never remove a command, since we need to know about views that
// used to exist so they can be deleted.  Instead, just leave both
// pii/nonPii commands undefined and the view will be deleted.
function getViewsMetadata(): SqlObjectMetadata[] {
  return [
    {
      schema: derivedSchema("cough"),
      name: "non_demo_surveys",
      nonPii: `
        select * from cough.current_surveys
        where survey->>'isDemo' = 'false'
      `,
    },
    {
      schema: derivedSchema("cough"),
      name: "survey_named_array_items",
      nonPii: `
        select
          id,
          "createdAt",
          "updatedAt",
          docid,
          device,
          survey,
          ${namedResponseColumns(SURVEY_QUESTIONS).join(",\n  ")},
          ${namedSampleColumns().join(",\n  ")}
        from ${derivedSchema("cough")}.non_demo_surveys
      `,
    },
    {
      schema: derivedSchema("cough"),
      name: "surveys",
      nonPii: `
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
        from ${derivedSchema("cough")}.survey_named_array_items
      `
    },
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
        (${selectIndexOfKeyValue("survey->'samples'", "sample_type", "manualEntry")})::text
      )->>'code' as samples_manualentry
    `,
    `
      jsonb_extract_path(
        survey->'samples',
        (${selectIndexOfKeyValue("survey->'samples'", "sample_type", "org.iso.Code128")})::text
      )->>'code' as samples_code128
    `,
    `
      jsonb_extract_path(
        survey->'samples',
        (${selectIndexOfKeyValue("survey->'samples'", "sample_type", "PhotoGUID")})::text
      )->>'code' as samples_photoguid
    `,
    `
      jsonb_extract_path(
        survey->'samples',
        (${selectIndexOfKeyValue("survey->'samples'", "sample_type", "RDTReaderPhotoGUID")})::text
      )->>'code' as samples_rdtreaderphotoguid
    `
  ]
}

function sampleColumns(): string[] {
  return [
    "samples_manualentry",
    "samples_code128",
    "samples_photoguid",
    "samples_rdtreaderphotoguid",
    `coalesce(samples_code128, samples_manualentry) as samples_barcode`,
    `coalesce(samples_rdtreaderphotoguid, samples_photoguid) as samples_photo`,
  ];
}

function answerColumns(questions: SurveyQuestion[]): string[] {
  return flatMap(columns, questions);

  function columns(question: SurveyQuestion): string[] {
    debug(`=== Generating Columns for ===\n${JSON.stringify(question, null, 2)}`);
    const qid = question.id.toLowerCase();
    switch (question.type) {
      // Text is just a label, and results in no data in db.
      case SurveyQuestionType.Text:
        return [];

      // `.answer` is a string with the data we want
      case SurveyQuestionType.DatePicker:
        return [`
          response_${qid}->'answer'->0->>'valueDateTime' as ${qid}
        `];

      case SurveyQuestionType.TextInput:
        return [`
          response_${qid}->'answer'->0->>'valueString' as ${qid}
        `];

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
        return optionQuestion.options.map((option, i) => `
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
        `);
      }

      default:
        throw new Error(`Unexpected SurveyQuestionType: ${question.type}`);
    }
  }
}

function selectIndexOfKeyValue(array: string, key: string, value: string, cond?: string): string {
  return `
    select * from generate_series(0, jsonb_array_length(${array})-1) as index
      where jsonb_extract_path(${array}, index::text)->>'${key}' = '${value}'${cond ? `
        and ${cond}
      ` : ""}

  `;
}

function derivedSchema(original: string): string {
  return `${original}_derived`;
}

function flatMap<I,O>(f: (input: I) => O[], inputs: I[]): O[] {
  return inputs.reduce((acc, x) => [ ...acc, ...f(x) ], []);
}

function debug(s: string) {
  if (DEBUG_DERIVED_TABLE_SERVICE) {
    console.log(`DerivedTableService: ${s}`);
  }
}
