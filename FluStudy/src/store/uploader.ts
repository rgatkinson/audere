// Copyright (c) 2018 by Audere
//
// Use of this source code is governed by an MIT-style license that
// can be found in the LICENSE file distributed with this file.

import { MiddlewareAPI, Dispatch, AnyAction } from "redux";
import { Address, Option, SurveyResponse } from "./types";
import { SurveyState, StoreState } from "./index";
import { createTransport } from "../transport";
import {
  AddressInfoUse,
  AddressValueInfo,
  ConsentInfo,
  PatientInfo,
  QuestionAnswerOption,
  ResponseInfo,
  ResponseItemInfo,
  SurveyInfo,
  TelecomInfoSystem,
  PatientInfoGender,
} from "audere-lib/feverProtocol";
import { isNotNull } from "../util/check";
import {
  FluShotConfig,
  FluShotDateConfig,
  BlueLineConfig,
  RedWhenBlueConfig,
  RedLineConfig,
  InContactConfig,
  CoughSneezeConfig,
  ChildrenWithChildrenConfig,
  HouseholdChildrenConfig,
  AssignedSexConfig,
} from "../resources/ScreenConfig";
import { Crashlytics } from "react-native-fabric";

export const { uploader, events, logger } = createTransport();

// See comment below on cleanupResponses.
const CONDITIONAL_QUESTIONS: ConditionalQuestion[] = [
  {
    conditionalId: CoughSneezeConfig.id,
    dependsOnId: InContactConfig.id,
    includeWhen: isSelected("yes"),
  },
  {
    conditionalId: FluShotDateConfig.id,
    dependsOnId: FluShotConfig.id,
    includeWhen: isSelected("yes"),
  },
  {
    conditionalId: ChildrenWithChildrenConfig.id,
    dependsOnId: HouseholdChildrenConfig.id,
    includeWhen: isSelected("yes"),
  },
  {
    conditionalId: RedWhenBlueConfig.id,
    dependsOnId: BlueLineConfig.id,
    includeWhen: isSelected("yes"),
  },
  {
    conditionalId: RedLineConfig.id,
    dependsOnId: BlueLineConfig.id,
    includeWhen: isSelected("no"),
  },
];

const GENDER_MAP = new Map([
  ["female", PatientInfoGender.Female] as GenderMapEntry,
  ["male", PatientInfoGender.Male] as GenderMapEntry,
  ["other", PatientInfoGender.Other] as GenderMapEntry,
]);
type GenderMapEntry = [string, PatientInfoGender];

// This is similar to the logger example at
// https://redux.js.org/api/applymiddleware

export function uploaderMiddleware({ getState }: MiddlewareAPI) {
  return (next: Dispatch) => (action: AnyAction) => {
    if (!getState || !getState()) {
      Crashlytics.log("getState or getState() invalid in uploader middleware");
    }

    const result = next(action);
    const state = getState();
    switch (action.type) {
      case "APPEND_EVENT":
        /*
         * Testing only writing to pouch when the user navigates between screens
         * for performance reasons.
      case "SET_CONSENT":
      case "SET_EMAIL":
      case "SET_KIT_BARCODE":
      case "SET_TEST_STRIP_IMG":
      case "SET_PUSH_STATE":
      case "SET_RESPONSES":
      case "SET_WORKFLOW":
      case "SET_DEMO":
         */
        if (state.survey.csruid) {
          uploader.saveSurvey(state.survey.csruid, redux_to_pouch(state));
        } else {
          logger.warn(
            "Skipping survey upload because no csruid is available yet"
          );
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
    patient: {
      telecom: [],
      address: [],
    },
    consents: [],
    samples: [],
    responses: [],
    events: state.survey.events,
    workflow: state.survey.workflow,
  };

  when(getGender(survey), x => (pouch.patient.gender = x));

  if (!!survey.email) {
    pouch.patient.telecom.push({
      system: TelecomInfoSystem.Email,
      value: survey.email,
    });
  }

  maybePushConsent(survey, pouch.consents);

  const responses = cleanupResponses(survey.responses);

  maybePushAddressResponse(
    responses,
    "Address",
    AddressInfoUse.Home,
    pouch.patient
  );

  if (!!survey.kitBarcode) {
    pouch.samples.push(survey.kitBarcode);
  }

  if (!!survey.testStripImg) {
    pouch.samples.push(survey.testStripImg);
  }

  pouch.pushNotificationState = survey.pushState;

  // Set all surveyResponses into pouch.responses
  pushResponses("SurveyQuestions", responses, pouch.responses);
  return pouch;
}

function maybePushConsent(survey: SurveyState, consents: ConsentInfo[]) {
  const consent = survey.consent;
  if (consent != null) {
    consents.push(consent);
  }
}

function maybePushAddressResponse(
  responses: SurveyResponse[],
  questionId: string,
  use: AddressInfoUse,
  patient: PatientInfo
): void {
  const response = responses.find(r => r.questionId === questionId);
  if (!!response) {
    maybePushAddress(response!.answer!.addressInput, use, patient);
  }
}

function maybePushAddress(
  addressInput: Address | undefined | null,
  use: AddressInfoUse,
  patient: PatientInfo
): void {
  const info = addressValueInfo(addressInput);
  if (info != null) {
    patient.address.push({
      use,
      ...info,
    });
    if (!!info.firstName) {
      patient.firstName = info.firstName;
    }
    if (!!info.lastName) {
      patient.lastName = info.lastName;
    }
  }
}

function addressValueInfo(
  addressInput: Address | undefined | null
): AddressValueInfo | null {
  if (addressInput != null) {
    const firstName = addressInput.firstName || "";
    const lastName = addressInput.lastName || "";
    const city = addressInput.city || "";
    const state = addressInput.state || "";
    const zipcode = addressInput.zipcode || "";
    const country = "";
    const line: string[] = [addressInput.address, addressInput.address2].filter(
      isNotNull
    );
    return {
      firstName,
      lastName,
      line,
      city,
      state,
      postalCode: zipcode,
      country,
    };
  }
  return null;
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

        const valueAddress = addressValueInfo(response.answer.addressInput);
        if (valueAddress != null) {
          item.answer.push({ valueAddress });
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

    const dependency = byId.get(conditional.dependsOnId);
    return dependency == null || conditional.includeWhen(dependency);
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
  dependsOnId: string;
  includeWhen: ResponsePredicate;
}

interface ResponsePredicate {
  (response: SurveyResponse): boolean;
}
