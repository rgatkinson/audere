// Copyright (c) 2018 by Audere
//
// Use of this source code is governed by an MIT-style license that
// can be found in the LICENSE file distributed with this file.

import { MiddlewareAPI, Dispatch, AnyAction } from "redux";
import { Option, SurveyResponse } from "./types";
import { SurveyState, StoreState } from "./index";
import {
  NonPIIConsentInfo,
  QuestionAnswerOption,
  ResponseInfo,
  ResponseItemInfo,
  SurveyInfo,
  PatientInfoGender,
} from "audere-lib/coughProtocol";
import {
  FluShotConfig,
  FluShotDateConfig,
  BlueLineConfig,
  PinkWhenBlueConfig,
  PinkLineConfig,
  InContactConfig,
  CoughSneezeConfig,
  ChildrenWithChildrenConfig,
  HouseholdChildrenConfig,
  AssignedSexConfig,
  FluShotNationalImmunization,
  FluShotNationalImmunizationCondition,
  PreviousSeason,
} from "audere-lib/coughQuestionConfig";
import { crashlytics } from "../crashReporter";
import { tracker, TransportEvents } from "../util/tracker";
import { syncSurvey } from "./FirebaseStore";

// See comment below on cleanupResponses.
const CONDITIONAL_QUESTIONS: ConditionalQuestion[] = [
  {
    conditionalId: CoughSneezeConfig.id,
    conditions: [
      {
        dependsOnId: InContactConfig.id,
        includeWhen: isSelected("yes"),
      },
    ],
  },
  {
    conditionalId: FluShotDateConfig.id,
    conditions: [
      {
        dependsOnId: FluShotConfig.id,
        includeWhen: isSelected("yes"),
      },
    ],
  },
  {
    conditionalId: FluShotNationalImmunization.id,
    conditions: [
      {
        dependsOnId: FluShotConfig.id,
        includeWhen: isSelected("yes"),
      },
    ],
  },
  {
    conditionalId: FluShotNationalImmunizationCondition.id,
    conditions: [
      { dependsOnId: FluShotConfig.id, includeWhen: isSelected("yes") },
      {
        dependsOnId: FluShotNationalImmunization.id,
        includeWhen: isSelected("yes"),
      },
    ],
  },
  {
    conditionalId: FluShotNationalImmunizationCondition.id,
    conditions: [
      {
        dependsOnId: FluShotNationalImmunization.id,
        includeWhen: isSelected("yes"),
      },
    ],
  },
  {
    conditionalId: PreviousSeason.id,
    conditions: [
      {
        dependsOnId: FluShotConfig.id,
        includeWhen: isSelected("neverFlu"),
        anythingBut: true,
      },
    ],
  },
  {
    conditionalId: ChildrenWithChildrenConfig.id,
    conditions: [
      {
        dependsOnId: HouseholdChildrenConfig.id,
        includeWhen: isSelected("yes"),
      },
    ],
  },
  {
    conditionalId: PinkWhenBlueConfig.id,
    conditions: [
      {
        dependsOnId: BlueLineConfig.id,
        includeWhen: isSelected("yes"),
      },
    ],
  },
  {
    conditionalId: PinkLineConfig.id,
    conditions: [
      {
        dependsOnId: BlueLineConfig.id,
        includeWhen: isSelected("no"),
      },
    ],
  },
];

const GENDER_MAP = new Map([
  ["female", PatientInfoGender.Female] as GenderMapEntry,
  ["male", PatientInfoGender.Male] as GenderMapEntry,
  ["indeterminate", PatientInfoGender.Other] as GenderMapEntry,
  ["preferNotToSay", PatientInfoGender.Unknown] as GenderMapEntry,
]);
type GenderMapEntry = [string, PatientInfoGender];

// This is similar to the logger example at
// https://redux.js.org/api/applymiddleware

export function uploaderMiddleware({ getState }: MiddlewareAPI) {
  return (next: Dispatch) => (action: AnyAction) => {
    if (!getState || !getState()) {
      crashlytics.log("getState or getState() invalid in uploader middleware");
    }

    const result = next(action);
    const state = getState();
    switch (action.type) {
      case "SET_RDT_INTERPRETATION_SHOWN": // FEV-695
      case "APPEND_EVENT":
        /*
         * Testing only writing to pouch when the user navigates between screens
         * for performance reasons.
      case "SET_CONSENT":
      case "SET_KIT_BARCODE":
      case "SET_TEST_STRIP_IMG":
      case "SET_PUSH_STATE":
      case "SET_RESPONSES":
      case "SET_WORKFLOW":
      case "SET_DEMO":
         */
        if (state.survey.csruid) {
          const docId = state.survey.csruid;
          const survey = redux_to_pouch(state);
          tracker.logEvent(TransportEvents.SURVEY_UPDATED, { docId });
          syncSurvey(docId, survey);
        }
        break;
    }
    return result;
  };
}

// Exported so we can write unit tests for this
export function redux_to_pouch(state: StoreState): SurveyInfo {
  const survey = state.survey;
  const pouch: SurveyInfo = {
    isDemo: state.meta.isDemo,
    marketingProperties: state.meta.marketingProperties,
    consents: [],
    samples: [],
    responses: [],
    events: state.survey.events,
    workflow: state.survey.workflow,
    rdtInfo: state.survey.rdtInfo,
  };

  when(getGender(survey), x => (pouch.gender = x));

  maybePushConsent(survey, pouch.consents);

  const responses = cleanupResponses(survey.responses);

  if (!!survey.kitBarcode) {
    pouch.samples.push(survey.kitBarcode);
  }

  if (!!survey.invalidBarcodes) {
    pouch.invalidBarcodes = survey.invalidBarcodes;
  }

  if (!!survey.testStripImg) {
    pouch.samples.push(survey.testStripImg);
  }

  if (!!survey.testStripHCImg) {
    pouch.samples.push(survey.testStripHCImg);
  }

  pouch.pushNotificationState = survey.pushState;

  // Set all surveyResponses into pouch.responses
  pushResponses("SurveyQuestions", responses, pouch.responses);
  return pouch;
}

function maybePushConsent(survey: SurveyState, consents: NonPIIConsentInfo[]) {
  const consent = survey.consent;
  if (consent != null) {
    consents.push(consent);
  }
}

function pushResponses(
  responseId: string,
  responses: SurveyResponse[],
  pouchResponses: ResponseInfo[]
): void {
  let items: ResponseItemInfo[] = [];
  responses.forEach(response => {
    let item: ResponseItemInfo = {
      id: response.questionId,
      text: response.questionText,
      answer: [],
    };

    if (!!response.answer) {
      let answerOptions: QuestionAnswerOption[] = [];
      if (!!response.optionLabels) {
        response.optionLabels.forEach(({ key, label }) => {
          answerOptions.push({
            id: key,
            text: label,
          });
        });
      }

      if (!!response.buttonLabels) {
        // Consider all buttons besides "done", "next", and "preferNotToSay" to be
        // multiple choice options
        response.buttonLabels.forEach(({ key, label }) => {
          if (key !== "preferNotToSay" && key !== "done" && key !== "next") {
            answerOptions.push({
              id: key,
              text: label,
            });
          }
        });
      }

      if (answerOptions.length > 0) {
        item.answerOptions = answerOptions;
      }

      if (response.answer.selectedButtonKey === "preferNotToSay") {
        item.answer.push({ valueDeclined: true });
      } else {
        if (item.answerOptions) {
          if (
            !!response.answer.options &&
            (response.answer.selectedButtonKey === "done" ||
              response.answer.selectedButtonKey === "next" ||
              !response.answer.selectedButtonKey)
          ) {
            // Actual multiple choice; find indices of all true values
            let i = 0;
            const otherOption = response.answer.otherOption;
            response.answer.options.forEach((option: Option) => {
              if (option.selected) {
                item.answer.push({ valueIndex: i });
              }
              // ASSUME the "Other" choice is always keyed "other"
              if (!!otherOption && option.key.toLowerCase() === "other") {
                item.answer.push({
                  valueOther: {
                    selectedIndex: i,
                    valueString: otherOption,
                  },
                });
              }
              i = i + 1;
            });
          } else {
            // Check if user pressed other button ("yes" "no" "do not know")
            const choiceArray = item.answerOptions;
            for (let i = 0; i < choiceArray.length; i++) {
              if (choiceArray[i].id === response.answer.selectedButtonKey) {
                item.answer.push({ valueIndex: i });
              }
            }
          }
        }

        if (response.answer.dateInput) {
          item.answer.push({
            valueDateTime: response.answer.dateInput.toISOString(),
          });
        }

        if (response.answer.numberInput || response.answer.numberInput === 0) {
          if (Number.isInteger(response.answer.numberInput)) {
            item.answer.push({ valueInteger: response.answer.numberInput });
          } else {
            item.answer.push({ valueString: "" + response.answer.numberInput });
          }
        }

        if (response.answer.textInput) {
          item.answer.push({ valueString: response.answer.textInput });
        }

        if (response.answer.booleanInput != null) {
          item.answer.push({ valueBoolean: response.answer.booleanInput });
        }
      }

      items.push(item);
    }
  });
  pouchResponses.push({ id: responseId, item: items });
}

function getGender(survey: SurveyState): Maybe<PatientInfoGender> {
  const key = buttonKey(survey, AssignedSexConfig.id);
  return (key && GENDER_MAP.get(key)) || undefined;
}

function buttonKey(
  survey: SurveyState,
  questionId: string
): string | undefined {
  const answer = answerForId(survey, questionId);
  if (answer) {
    return answer.selectedButtonKey;
  }
  return undefined;
}

function answerForId(survey: SurveyState, questionId: string) {
  const response = survey.responses.find(r => r.questionId === questionId);
  if (response) {
    return response.answer;
  } else {
    return undefined;
  }
}

type Maybe<T> = T | null | undefined;
function when<T>(maybe: Maybe<T>, then: (item: T) => void) {
  if (maybe) {
    then(maybe);
  }
}

// This filters responses to remove things that are inconsistent.
// E.g. we normally only ask the CoughSneezeConfig question if the
// person answered yes on the InContactConfig question.  However,
// it is possible for the person to:
//
// - answer InContactConfig with yes
// - answer CoughSneezeConfig
// - go back and change InContactConfig to no
//
// At this point, we have an answer for CoughSneezeConfig but the
// InContactConfig is in a state that normally would not allow that.
//
// We could delete the CoughSneezeConfig in the UI store, but then if
// they hit the final "no" by accident and put it back to "yes" then
// we just lost their CoughSneezeConfig answer.
//
// So instead, we filter out the alternate universe responses here
// before uploading.
function cleanupResponses(responses: SurveyResponse[]): SurveyResponse[] {
  const byId = new Map(responses.map(responseById));

  return responses.filter(r => {
    const conditional = CONDITIONAL_QUESTIONS.find(
      c => c.conditionalId === r.questionId
    );
    if (conditional == null) {
      return true;
    }

    for (let i = 0; i < conditional.conditions.length; i++) {
      const dependency = byId.get(conditional.conditions[i].dependsOnId);
      const condition = conditional.conditions[i];

      if (
        dependency != null &&
        !!condition.anythingBut &&
        condition.includeWhen(dependency)
      ) {
        return false;
      }

      if (
        dependency != null &&
        !condition.anythingBut &&
        !condition.includeWhen(dependency)
      ) {
        return false;
      }
    }
    return true;
  });
}

function isSelected(...keys: string[]): ResponsePredicate {
  return (resp: SurveyResponse) =>
    resp.answer != null && keys.some(x => x === resp.answer!.selectedButtonKey);
}

function responseById(r: SurveyResponse): ById<SurveyResponse> {
  return [r.questionId, r];
}

type ById<T> = [string, T];

interface ConditionalQuestion {
  conditionalId: string;
  conditions: Condition[];
}

interface Condition {
  dependsOnId: string;
  includeWhen: ResponsePredicate;
  anythingBut?: boolean;
}

interface ResponsePredicate {
  (response: SurveyResponse): boolean;
}
