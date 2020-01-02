// Copyright (c) 2019 by Audere
//
// Use of this source code is governed by an MIT-style license that
// can be found in the LICENSE file distributed with this file.

import {
  OptionQuestion,
  SurveyQuestion,
  SurveyQuestionType,
} from "audere-lib/chillsQuestionConfig";
import logger from "../../util/logger";

export function namedResponseColumns(questions: SurveyQuestion[]): string[] {
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
      `,
    ];
  }
}

export function namedSampleColumns(): string[] {
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
          "org.iso.Code39"
        )})::text
      )->>'code' as samples_code39
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
          "2"
        )})::text
      )->>'code' as samples_2
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
    `,
    `
      jsonb_extract_path(
        survey->'samples',
        (${selectIndexOfKeyValue(
          "survey->'samples'",
          "sample_type",
          "RDTTestAreaPhotoGUID"
        )})::text
      )->>'code' as samples_rdtreadertestareaphotoguid
    `,
  ];
}

export function sampleColumns(columnPrefix?: string): string[] {
  const prefix = columnPrefix || "";
  return [
    `${prefix}samples_manualentry`,
    `${prefix}samples_code128`,
    `${prefix}samples_code39`,
    `${prefix}samples_photoguid`,
    `${prefix}samples_rdtreaderphotoguid`,
    `${prefix}samples_rdtreaderhcphotoguid`,
    `${prefix}samples_rdtreadertestareaphotoguid`,
    `coalesce(${prefix}samples_code128, ${prefix}samples_code39, ${prefix}samples_1, ${prefix}samples_2, ${prefix}samples_manualentry) as samples_barcode`,
    `coalesce(${prefix}samples_rdtreaderphotoguid, ${prefix}samples_photoguid) as samples_photo`,
  ];
}

export function answerColumns(
  questions: SurveyQuestion[],
  columnPrefix?: string
): string[] {
  const prefix = columnPrefix || "";
  return flatMap(columns, questions);

  function columns(question: SurveyQuestion): string[] {
    logger.debug(`Generating Columns for: ${JSON.stringify(question)}`);
    const qid = question.id.toLowerCase();
    switch (question.type) {
      // Text is just a label, and results in no data in db.
      case SurveyQuestionType.Text:
        return [];

      // `.answer` is a string with the data we want
      case SurveyQuestionType.DatePicker:
      case SurveyQuestionType.MonthPicker:
        return [
          `
          ${prefix}response_${qid}->'answer'->0->>'valueDateTime' as ${qid}
        `,
        ];

      case SurveyQuestionType.TextInput:
      case SurveyQuestionType.ZipCodeInput:
        return [
          `
          ${prefix}response_${qid}->'answer'->0->>'valueString' as ${qid}
        `,
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
              ${prefix}response_${qid}->'answerOptions',
              ${prefix}response_${qid}->'answer'->0->>'valueIndex'
            )->>'id' as ${qid}
          `,
        ];

      case SurveyQuestionType.MultiDropdown:
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
                `${prefix}response_${qid}->'answerOptions'`,
                "id",
                option,
                `${prefix}response_${qid}->'answer' @> ('[{"valueIndex":' || index || '}]')::jsonb`
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

export function matchesIfNotNull(
  expression: string,
  valueToMatch: string,
  matchValue: string,
  noMatchValue: string
): string {
  return `
    case
      when ${expression} = null then null
      when ${expression} = '${valueToMatch}' then '${matchValue}'
      else '${noMatchValue}'
    end
  `;
}

export function caseIf(
  ifExpression: string,
  thenExpression: string,
  elseExpression: string
): string {
  return `
    case
      when ${ifExpression} then ${thenExpression}
      else ${elseExpression}
    end
  `;
}

export function answerValue(question: SurveyQuestion): string {
  const qid = question.id.toLowerCase();

  function getSingleAnswerOption(): string {
    // `.answer` is `[{"valueIndex": N}]`, where N is an index into `.answerOptions`.
    // `.answerOptions` is `[{"id":"","text":""},...]
    // So we want to return the text of the selected answer index
    return `
      jsonb_extract_path(
        response_${qid}->'answerOptions',
        response_${qid}->'answer'->0->>'valueIndex'
      )->>'text'
    `;
  }

  function getAnswerOptionsList(): string {
    // `.answer` is `{"valueIndex": N0, "valueIndex": N1}`, where N0,N1 are indexes
    // into `.answerOptions`.
    // `.answerOptions` is `[{"id":"","text":""},...]
    // We want to return the text answer from each selected option in a list
    return `
      (select
        array_to_string(array_agg(jsonb_extract_path(
          response_${qid}->'answerOptions',
          a->>'valueIndex'
        )->>'text'), ',')
      from
        jsonb_array_elements(response_${qid}->'answer') a)
    `;
  }

  switch (question.type) {
    // Text is just a label, and results in no data in db.
    case SurveyQuestionType.Text:
      return `null`;

    // `.answer` is a string with the data we want
    case SurveyQuestionType.DatePicker:
      return `response_${qid}->'answer'->0->'valueDateTime'`;

    case SurveyQuestionType.TextInput:
      return `response_${qid}->'answer'->0->'valueString'`;

    case SurveyQuestionType.ButtonGrid:
      return getSingleAnswerOption();

    case SurveyQuestionType.Dropdown:
      return getSingleAnswerOption();

    case SurveyQuestionType.RadioGrid:
      return getSingleAnswerOption();

    case SurveyQuestionType.OptionQuestion:
      return getAnswerOptionsList();

    default:
      throw new Error(`Unexpected SurveyQuestionType: ${question.type}`);
  }
}

export function selectIndexOfKeyValue(
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

export function flatMap<I, O>(f: (input: I) => O[], inputs: I[]): O[] {
  return inputs.reduce((acc, x) => [...acc, ...f(x)], []);
}
