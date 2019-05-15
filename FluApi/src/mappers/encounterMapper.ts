// Copyright (c) 2018 by Audere
//
// Use of this source code is governed by an MIT-style license that
// can be found in the LICENSE file distributed with this file.

import * as Encounter from "audere-lib/hutchProtocol";
import * as Model from "audere-lib/common";
import { Locations as Sites } from "audere-lib/locations";
import { NonPIIEncounterDetails } from "../models/encounterDetails";
import moment from "moment";
import logger from "../util/logger";
import { FollowUpSurveyData } from "../external/redCapClient";
import { mapSurvey } from "./followUpSurveyMapper";

const buildInfo = require("../../static/buildInfo.json");

/**
 * Convert visit details into an Encounter. Big transformation step before
 * sending to external partners.
 * @param input View of a full visit with sensitive information de-identified.
 */
export function mapEncounter(
  input: NonPIIEncounterDetails
): Encounter.Encounter {
  const events = mapEvents(input.events, input.consentDate);
  const sampleCodes = mapSamples(input.samples, input.site);
  const responses = mapResponses(input.responses, input.followUpResponses);

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
  const administeredAt = Sites[input.site];
  if (administeredAt != null) {
    site = { type: administeredAt.type, name: input.site };
  } else {
    site = { type: undefined, name: input.site };
  }

  let startTimestamp: moment.Moment;

  if (input.startTime != null) {
    startTimestamp = moment(input.startTime);
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
    id: input.encounterId,
    participant: input.participant,
    revision: revision,
    localeLanguageCode: "en", // TODO: "es" support
    startTimestamp: startTimestamp.toISOString(),
    site: site,
    locations: input.locations,
    sampleCodes: sampleCodes,
    responses: responses,
    events: events,
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
        converted.push({
          type: "String",
          value: String(a.valueBoolean)
        });
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
      } else if (a.valueIndex != null) {
        selectedOptions.push(+a.valueIndex);
      } else if (a.valueOther != null) {
        selectedOptions.push(+a.valueOther.selectedIndex);
      } else if (a.valueDeclined != null) {
        converted.push({
          type: "Declined"
        });
      } else {
        throw new Error("Response with no set answer");
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

function mapEvents(
  events: Model.EventInfo[],
  consentDate: string
): Encounter.Event[] {
  const results = [];

  if (events != null && events.length > 0) {
    let barcodeScanned: string;
    let startedQuestionnaire: string;
    let symptomsScreened: string;

    events.forEach(e => {
      switch (e.refId) {
        case "ManualConfirmation":
          if (barcodeScanned == null || barcodeScanned < e.at) {
            barcodeScanned = e.at;
          }
          break;
        case "ScanConfirmation":
          if (barcodeScanned == null || barcodeScanned < e.at) {
            barcodeScanned = e.at;
          }
          break;
        case "WhenSymptoms":
          if (startedQuestionnaire == null || startedQuestionnaire < e.at) {
            startedQuestionnaire = e.at;
          }
          break;
        case "ThankYouScreening":
          if (symptomsScreened == null || symptomsScreened < e.at) {
            symptomsScreened = e.at;
          }
          break;
        case "ConfirmationScreen":
          if (symptomsScreened == null || symptomsScreened < e.at) {
            symptomsScreened = e.at;
          }
          break;
      }
    });

    if (barcodeScanned != null) {
      results.push({
        time: barcodeScanned,
        eventType: Encounter.EventType.BarcodeScanned
      });
    }

    if (startedQuestionnaire != null) {
      results.push({
        time: startedQuestionnaire,
        eventType: Encounter.EventType.StartedQuestionnaire
      });
    }

    if (symptomsScreened != null) {
      results.push({
        time: symptomsScreened,
        eventType: Encounter.EventType.SymptomsScreened
      });
    }

    if (consentDate != null) {
      results.push({
        time: consentDate,
        eventType: Encounter.EventType.ConsentSigned
      });
    }
  }

  return results;
}

/**
 * Converts questions and their responses for downstream partners.
 */
function mapResponses(
  responses: Model.ResponseInfo[],
  followUpResponses: FollowUpSurveyData
): Encounter.Response[] {
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

  if (followUpResponses != null) {
    converted.push(...mapSurvey(followUpResponses));
  }

  return converted;
}

function mapSamples(
  samples: Model.SampleInfo[],
  site: string
): Encounter.SampleCode[] {
  if (samples == null) {
    return [];
  }

  return samples.map(s => {
    let sampleType: Encounter.SampleType;

    if (site === "self-test") {
      if (s.sample_type === "manualEntry") {
        sampleType = Encounter.SampleType.ManualSelfSwab;
      } else if (s.sample_type === "org.iso.Code128") {
        sampleType = Encounter.SampleType.ScannedSelfSwab;
      } else if (s.sample_type === "TestStripBase64") {
        sampleType = Encounter.SampleType.StripPhoto;
      } else {
        throw Error(`Unknown Fever sample type: ${s.sample_type}`);
      }
    } else {
      sampleType = Encounter.SampleType.ClinicSwab;
    }

    return {
      type: sampleType,
      code: s.code
    };
  });
}
