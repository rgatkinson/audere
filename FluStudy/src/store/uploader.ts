// Copyright (c) 2018 by Audere
//
// Use of this source code is governed by an MIT-style license that
// can be found in the LICENSE file distributed with this file.

import { MiddlewareAPI, Dispatch, AnyAction } from "redux";
import { Address, Option, SurveyResponse } from "./types";
import { SurveyState, StoreState } from "./index";
import { createTransport } from "../transport";
import { format } from "date-fns";
import {
  AddressInfo,
  AddressInfoUse,
  AddressValueInfo,
  ConsentInfo,
  ConsentInfoSignerType,
  PatientInfo,
  PatientInfoGender,
  QuestionAnswerOption,
  ResponseInfo,
  ResponseItemInfo,
  SampleInfo,
  SurveyInfo,
  TelecomInfoSystem,
} from "audere-lib/feverProtocol";
import { isNotNull } from "../util/check";

export const { uploader, logger } = createTransport();

// This is similar to the logger example at
// https://redux.js.org/api/applymiddleware

export function uploaderMiddleware({ getState }: MiddlewareAPI) {
  return (next: Dispatch) => (action: AnyAction) => {
    const result = next(action);
    const state = getState();
    switch (action.type) {
      case "APPEND_EVENT":
      case "SET_CONSENT":
      case "SET_EMAIL":
      case "SET_KIT_BARCODE":
      case "SET_PUSH_STATE":
      case "SET_RESPONSES":
      case "SET_WORKFLOW":
      case "SET_DEMO":
        uploader.saveSurvey(state.survey.id, redux_to_pouch(state));
        break;
    }
    return result;
  };
}

// Exported so we can write unit tests for this
export function redux_to_pouch(state: StoreState): SurveyInfo {
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

  const survey = state.survey;
  if (!!survey.email) {
    pouch.patient.telecom.push({
      system: TelecomInfoSystem.Email,
      value: survey.email,
    });
  }

  maybePushConsent(survey, pouch.consents);

  const responses = survey.responses;

  maybePushAddressResponse(
    responses,
    "Address",
    AddressInfoUse.Home,
    pouch.patient
  );

  if (!!survey.kitBarcode) {
    pouch.samples.push(survey.kitBarcode);
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
    if (!!info.name) {
      patient.name = info.name;
    }
  }
}

function addressValueInfo(
  addressInput: Address | undefined | null
): AddressValueInfo | null {
  if (addressInput != null) {
    const name = addressInput.name || "";
    const city = addressInput.city || "";
    const state = addressInput.state || "";
    const zipcode = addressInput.zipcode || "";
    const country = "";
    const line: string[] = [addressInput.address, addressInput.address2].filter(
      isNotNull
    );
    return {
      name,
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
