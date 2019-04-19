// Copyright (c) 2018 by Audere
//
// Use of this source code is governed by an MIT-style license that
// can be found in the LICENSE file distributed with this file.

import * as Encounter from "audere-lib/hutchProtocol";
import * as Model from "audere-lib/snifflesProtocol";
import { Locations as Sites } from "audere-lib/locations";
import { NonPIIVisitDetails } from "../models/visitDetails";
import moment from "moment";
import logger from "../util/logger";

const buildInfo = require("../../static/buildInfo.json");

/**
 * Convert visit details into an Encounter. Big transformation step before
 * sending to external partners.
 * @param input View of a full visit with sensitive information de-identified.
 */
export function mapEncounter(input: NonPIIVisitDetails): Encounter.Encounter {
  if (input.visitInfo == null) {
    throw new Error("Visit does not contain visit information");
  }

  const sampleCodes = mapSamples(input.visitInfo.samples);
  const responses = mapResponses(input.visitInfo.responses);

  // Revision can be traced back to individual versions to correlate
  // cause/effect with output data.
  let revision: string;

  if (buildInfo.hash != null) {
    revision = buildInfo.hash;
  } else {
    logger.error(
      "Hash is not populated in build info so the encounter revision can " +
        "not be specified"
    );
  }

  // Populate survey site then visit start date if that information has been
  // provided.
  let site: Encounter.Site;
  const administeredAt = Sites[input.visitInfo.location];
  if (administeredAt != null) {
    site = { type: administeredAt.type, name: input.visitInfo.location };
  } else {
    site = { type: undefined, name: input.visitInfo.location };
  }

  let startTimestamp: moment.Moment;

  if (input.visitInfo.events != null && input.visitInfo.events.length > 0) {
    const visitEvent = input.visitInfo.events.find(
      e => e.kind == Model.EventInfoKind.Visit
    );

    if (visitEvent != null) {
      startTimestamp = moment(visitEvent.at);
    }
  }

  // Fallback to consent date.
  if (startTimestamp == null) {
    if (input.consentDate != null) {
      // Note: this value does not contain timezone information so timezone is
      // inferred while parsing and the resulting value converted to UTC
      startTimestamp = moment(input.consentDate, "YYYY-MM-DD");
    } else {
      throw Error(`Visit should have start timestamp, id ${input.id}`);
    }
  }

  let age: Encounter.Age;
  const years = startTimestamp.year() - input.birthYear;

  if (years >= 0) {
    // Ages 90+ can not be reported.
    if (years < 90) {
      age = { value: years, ninetyOrAbove: false };
    } else {
      age = { ninetyOrAbove: true };
    }
  }

  const output: Encounter.Encounter = {
    schemaVersion: Encounter.schemaVersion,
    id: input.visitId,
    participant: input.participant,
    revision: revision,
    localeLanguageCode: "en", // TODO: "es" support
    startTimestamp: startTimestamp.toISOString(),
    site: site,
    locations: input.locations,
    sampleCodes: sampleCodes,
    responses: responses,
    age: age
  };

  return output;
}

/**
 * Maps by type from individual answers into data for downstream systems.
 * @param answers List of converted answers
 */
function mapAnswers(answers: Model.AnswerInfo[]): Encounter.Answer[] {
  let converted: Encounter.Answer[] = [];

  if (answers != null) {
    // We collect all selected options into a single multi-value answer.
    let selectedOptions: number[] = [];

    answers.forEach(a => {
      if (a.valueBoolean != null) {
        // TODO: Remove boolean answers from the shared protocol
        logger.error(
          "Boolean formatted answers are deprecated and will be removed " +
            "from the visit protocol"
        );

        throw new Error("Visit contains a boolean response");
      } else if (a.valueDateTime != null) {
        converted.push({
          type: "String",
          value: a.valueDateTime
        });
      } else if (a.valueDecimal != null) {
        converted.push({
          type: "Number",
          value: a.valueDecimal
        });
      } else if (a.valueInteger != null) {
        converted.push({
          type: "Number",
          value: a.valueInteger
        });
      } else if (a.valueString != null) {
        converted.push({
          type: "String",
          value: a.valueString
        });
      } else if (a.valueAddress != null) {
        logger.error(
          "Address formatted answers are likely to be PII and should not be " +
            "present in the non-PII response set"
        );

        throw new Error("Visit contains an address response");
      } else if (a.valueIndex != null) {
        selectedOptions.push(+a.valueIndex);
      } else if (a.valueOther != null) {
        selectedOptions.push(+a.valueOther.selectedIndex);
      } else if (a.valueDeclined != null) {
        converted.push({
          type: "Declined"
        });
      }
    });

    if (selectedOptions.length > 0) {
      converted.push({
        type: "Option",
        chosenOptions: selectedOptions
      });
    }
  }

  return converted;
}

/**
 * For questions with a fixed set of options we pass along our identifier and
 * text.
 */
function mapAnswerOptions(
  options: Model.QuestionAnswerOption[]
): Encounter.LocalText[] {
  if (options == null) {
    return [];
  }

  return options.map(o => ({
    token: o.id,
    text: o.text
  }));
}

/**
 * Converts questions and their responses for downstream partners.
 */
function mapResponses(responses: Model.ResponseInfo[]): Encounter.Response[] {
  if (responses == null || responses.length === 0) {
    throw new Error("Visit has no responses");
  }

  const converted = [];

  const r = responses.forEach(r => {
    r.item.forEach(i => {
      const options = mapAnswerOptions(i.answerOptions);
      const answers = mapAnswers(i.answer);

      answers.forEach(ans => {
        converted.push({
          question: { token: i.id, text: i.text },
          options: options.length > 0 ? options : undefined,
          answer: ans
        });
      });
    });
  });

  return converted;
}

function mapSamples(samples: Model.SampleInfo[]): Encounter.SampleCode[] {
  if (samples == null) {
    return [];
  }

  return samples.map(s => ({
    type: Encounter.SampleType.ClinicSwab,
    code: s.code
  }));
}
