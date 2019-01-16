// Copyright (c) 2018 by Audere
//
// Use of this source code is governed by an MIT-style license that
// can be found in the LICENSE file distributed with this file.

import { MiddlewareAPI, Dispatch, AnyAction } from "redux";
import {
  default as form,
  Address,
  FormState,
  Option,
  Sample,
  SurveyResponse,
} from "./form";
import { StoreState } from "./StoreState";
import { createUploader } from "../transport";
import { format } from "date-fns";
import {
  AddressInfo,
  AddressInfoUse,
  AddressValueInfo,
  ConsentInfo,
  ConsentInfoSignerType,
  PatientInfoGender,
  QuestionAnswerOption,
  ResponseItemInfo,
  TelecomInfoSystem,
  VisitInfo,
} from "audere-lib";
import { isNotNull } from "../util/check";

// This is similar to the logger example at
// https://redux.js.org/api/applymiddleware

export const uploader = createUploader();

export function uploaderMiddleware({ getState }: MiddlewareAPI) {
  return (next: Dispatch) => (action: AnyAction) => {
    const result = next(action);
    const state = getState();
    if (state.form != null && state.form.formId != null) {
      uploader.saveVisit(state.form.formId, redux_to_pouch(state));
    }
    return result;
  };
}

// Exported so we can write unit tests for this
export function redux_to_pouch(state: StoreState): VisitInfo {
  const pouch: VisitInfo = {
    isDemo: !!state.admin.isDemo,
    complete: state.form.completedSurvey,
    samples: [],
    giftcards: [],
    patient: {
      telecom: [],
      address: [],
    },
    consents: [],
    responses: [],
    events: [],
  };

  const form = state.form;
  if (form.admin != null) {
    pouch.administrator = form.admin;
  }
  if (form.location != null) {
    pouch.location = form.location;
  }
  if (!!form.name) {
    pouch.patient.name = form.name;
  }
  if (!!form.email) {
    pouch.patient.telecom.push({
      system: TelecomInfoSystem.Email,
      value: form.email,
    });
  }

  if (!!form.samples) {
    form.samples.forEach((sample: Sample) => {
      pouch.samples.push({
        sample_type: sample.sampleType,
        code: sample.code,
      });
    });
  }

  if (!!form.giftcards) {
    pouch.giftcards = form.giftcards;
  }

  maybePushConsent(form, pouch.consents);
  const responses = form.responses;

  const birthDateResponse = responses.find(
    response => response.questionId === "BirthDate"
  );
  if (!!birthDateResponse) {
    const birthDate = birthDateResponse!.answer!.dateInput;
    if (!!birthDate) {
      pouch.patient.birthDate = birthDate.toISOString().substring(0, 10); // FHIR:date
    }
  }

  maybePushAddressResponse(
    responses,
    "WorkAddress",
    AddressInfoUse.Work,
    pouch
  );
  maybePushAddressResponse(responses, "Address", AddressInfoUse.Home, pouch);
  maybePushAddressResponse(
    responses,
    "AddressCampus",
    AddressInfoUse.Home,
    pouch
  );

  const assignedSexResponse = responses.find(
    response => response.questionId === "AssignedSex"
  );
  if (!!assignedSexResponse) {
    let buttonKey = assignedSexResponse!.answer!.selectedButtonKey;
    switch (buttonKey) {
      case "male":
        pouch.patient.gender = PatientInfoGender.Male;
        break;
      case "female":
        pouch.patient.gender = PatientInfoGender.Female;
        break;
      case "other":
        pouch.patient.gender = PatientInfoGender.Other;
        break;
      default:
        // Prefer not to say
        pouch.patient.gender = PatientInfoGender.Unknown;
        break;
    }
  }

  // Set all surveyResponses into pouch.responses
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
        // Consider all buttons besides "done" and "preferNotToSay" to be
        // multiple choice options
        response.buttonLabels.forEach(({ key, label }) => {
          if (key !== "preferNotToSay" && key !== "done") {
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
      }

      items.push(item);
    }
  });
  pouch.responses.push({ id: "Questionnaire", item: items });

  return pouch;
}

function maybePushConsent(form: FormState, consents: ConsentInfo[]) {
  const consent = form.consent;
  if (consent != null) {
    consents.push(consent);
  }

  const assent = form.assent;
  if (assent != null) {
    consents.push(assent);
  }

  const parentConsent = form.parentConsent;
  if (parentConsent != null) {
    consents.push(parentConsent);
  }

  const bloodConsent = form.bloodConsent;
  if (bloodConsent != null) {
    consents.push(bloodConsent);
  }

  const hipaaConsent = form.hipaaConsent;
  if (hipaaConsent != null) {
    consents.push(hipaaConsent);
  }
}

function maybePushAddressResponse(
  responses: SurveyResponse[],
  questionId: string,
  use: AddressInfoUse,
  pouch: VisitInfo
): void {
  const response = responses.find(r => r.questionId === questionId);
  if (!!response) {
    maybePushAddress(
      response!.answer!.addressInput,
      use,
      pouch.patient.address
    );
  }
}

function maybePushAddress(
  addressInput: Address | undefined | null,
  use: AddressInfoUse,
  addresses: AddressInfo[]
): void {
  const info = addressValueInfo(addressInput);
  if (info != null) {
    addresses.push({
      use,
      ...info,
    });
  }
}

function addressValueInfo(
  addressInput: Address | undefined | null
): AddressValueInfo | null {
  if (addressInput != null) {
    const city = addressInput.city || "";
    const state = addressInput.state || "";
    const zipcode = addressInput.zipcode || "";
    const country = addressInput.country || "";
    const line: string[] = [addressInput.location, addressInput.address].filter(
      isNotNull
    );
    return {
      line,
      city,
      state,
      postalCode: zipcode,
      country,
    };
  }
  return null;
}
