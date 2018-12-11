// Copyright (c) 2018 by Audere
//
// Use of this source code is governed by an MIT-style license that
// can be found in the LICENSE file distributed with this file.

import { MiddlewareAPI, Dispatch, AnyAction } from "redux";
import { default as form, Address, FormState } from "./form";
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
import { checkNotNull, isNotNull } from "../util/check";

// This is similar to the logger example at
// https://redux.js.org/api/applymiddleware

export const uploader = createUploader();

export function uploaderMiddleware({ getState }: MiddlewareAPI) {
  return (next: Dispatch) => (action: AnyAction) => {
    const result = next(action);
    const state = getState();
    if (state.form != null) {
      uploader.saveVisit(state.form.formId, redux_to_pouch(state));
    }
    return result;
  };
}

// Exported so we can write unit tests for this
export function redux_to_pouch(state: StoreState): VisitInfo {
  const pouch: VisitInfo = {
    complete: state.form.completedSurvey,
    samples: [],
    patient: {
      telecom: [],
      address: [],
    },
    consents: [],
    responses: [],
    events: [],
  };

  const admin = state.admin;
  if (admin != null) {
    if (admin.location != null) {
      pouch.location = admin.location;
    }
  }

  const form = state.form;
  if (form != null) {
    if (!!form.name) {
      pouch.patient.name = form.name;
    }
    if (!!form.email) {
      pouch.patient.telecom.push({
        system: TelecomInfoSystem.Email,
        value: form.email,
      });
    }

    maybePushConsent(form, pouch.consents);
    const responses = form.surveyResponses;
    if (!!responses && responses instanceof Map) {
      if (responses.has("BirthDate")) {
        const birthDate = responses.get("BirthDate")!.answer!.dateInput;
        if (!!birthDate) {
          pouch.patient.birthDate = birthDate.toISOString().substring(0, 10); // FHIR:date
        }
      }
      if (responses.has("Address")) {
        maybePushAddress(
          responses.get("Address")!.answer!.addressInput,
          AddressInfoUse.Home,
          pouch.patient.address
        );
      }
      if (responses.has("WorkAddress")) {
        maybePushAddress(
          responses.get("WorkAddress")!.answer!.addressInput,
          AddressInfoUse.Work,
          pouch.patient.address
        );
      }
      if (responses.has("AssignedSex")) {
        let buttonKey = responses.get("AssignedSex")!.answer!.selectedButtonKey;
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
      for (const [key, value] of responses.entries()) {
        let item: ResponseItemInfo = {
          id: key,
          text: value.questionText,
          answer: [],
        };
        const surveyAnswer = value.answer;
        if (!surveyAnswer) {
          continue;
        }
        let answerOptions: QuestionAnswerOption[] = [];
        const options = surveyAnswer.options;
        const optionKeysToLabel = value.optionKeysToLabel;
        if (!!optionKeysToLabel) {
          for (const [key, value] of optionKeysToLabel.entries()) {
            answerOptions.push({
              id: key,
              text: value,
            });
          }
        }
        const buttonOptions = value.buttonOptions;
        // Consider all buttons besides "done" and "preferNotToSay" to be
        // multiple choice options
        if (!!buttonOptions) {
          for (const button of buttonOptions.keys()) {
            if (button !== "preferNotToSay" && button !== "done") {
              answerOptions.push({
                id: button,
                text: checkNotNull(buttonOptions.get(button)),
              });
            }
          }
        }
        if (answerOptions.length > 0) {
          item.answerOptions = answerOptions;
        }
        if (surveyAnswer.selectedButtonKey === "preferNotToSay") {
          item.answer.push({ valueDeclined: true });
        } else {
          if (item.answerOptions) {
            if (
              !!options &&
              (surveyAnswer.selectedButtonKey === "done" ||
                surveyAnswer.selectedButtonKey == null)
            ) {
              // Actual multiple choice; find indices of all true values
              const optionArray: string[] = Array.from(options.keys());
              for (let i = 0; i < optionArray.length; i++) {
                if (options.get(optionArray[i])) {
                  item.answer.push({ valueInteger: i });
                  // ASSUME the "Other" choice is always keyed "other"
                  if (
                    !!surveyAnswer.otherOption &&
                    optionArray[i].toLowerCase() === "other"
                  ) {
                    item.answer.push({
                      valueOther: {
                        selectedIndex: i,
                        valueString: surveyAnswer.otherOption,
                      },
                    });
                  }
                }
              }
            } else {
              // Check if user pressed other button ("yes" "no" "do not know")
              const choiceArray = item.answerOptions;
              for (let i = 0; i < choiceArray.length; i++) {
                if (choiceArray[i].id === surveyAnswer.selectedButtonKey) {
                  item.answer.push({ valueInteger: i });
                }
              }
            }
          }

          const valueAddress = addressValueInfo(surveyAnswer.addressInput);
          if (valueAddress != null) {
            item.answer.push({ valueAddress });
          }

          if (surveyAnswer.dateInput) {
            item.answer.push({
              valueDateTime: surveyAnswer.dateInput.toISOString(),
            });
          }
          if (surveyAnswer.numberInput) {
            if (Number.isInteger(surveyAnswer.numberInput)) {
              item.answer.push({ valueInteger: surveyAnswer.numberInput });
            } else {
              item.answer.push({ valueDecimal: surveyAnswer.numberInput });
            }
          }
          if (surveyAnswer.textInput) {
            item.answer.push({ valueString: surveyAnswer.textInput });
          }
        }
        items.push(item);
      }
      pouch.responses.push({ id: "Questionnaire", item: items });
    }
  }
  return pouch;
}

function maybePushConsent(form: FormState, consents: ConsentInfo[]) {
  const signature = form.signatureBase64 || "";
  const terms = form.consentTerms || "";
  const name = form.name || "";

  consents.push({
    name,
    terms,
    signature,
    signerType: ConsentInfoSignerType.Subject, // TODO
    date: format(new Date(), "YYYY-MM-DD"), // FHIR:date
  });
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
