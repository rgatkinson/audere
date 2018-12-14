// Copyright (c) 2018 by Audere
//
// Use of this source code is governed by an MIT-style license that
// can be found in the LICENSE file distributed with this file.

import { MiddlewareAPI, Dispatch, AnyAction } from "redux";
import { default as form, Address, FormState, Option, Sample } from "./form";
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

  const addressResponse = responses.find(
    response => response.questionId === "Address"
  );
  if (!!addressResponse) {
    maybePushAddress(
      addressResponse!.answer!.addressInput,
      AddressInfoUse.Home,
      pouch.patient.address
    );
  }

  const workAddressResponse = responses.find(
    response => response.questionId === "WorkAddress"
  );
  if (!!workAddressResponse) {
    maybePushAddress(
      workAddressResponse!.answer!.addressInput,
      AddressInfoUse.Work,
      pouch.patient.address
    );
  }

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
                item.answer.push({ valueInteger: i });
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
                item.answer.push({ valueInteger: i });
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

        if (response.answer.numberInput) {
          if (Number.isInteger(response.answer.numberInput)) {
            item.answer.push({ valueInteger: response.answer.numberInput });
          } else {
            item.answer.push({ valueDecimal: response.answer.numberInput });
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
  const signature = form.signatureBase64 || "";
  const terms = form.consentTerms || "";
  const name = form.name || "";
  const bloodSignature = form.bloodSignatureBase64 || "";
  const bloodTerms = form.bloodConsentTerms || "";

  if (signature.length > 0) {
    consents.push({
      name,
      terms,
      signature,
      signerType: ConsentInfoSignerType.Subject, // TODO
      date: format(new Date(), "YYYY-MM-DD"), // FHIR:date
    });
  }

  if (bloodSignature.length > 0) {
    consents.push({
      name,
      terms: bloodTerms,
      signature: bloodSignature,
      signerType: ConsentInfoSignerType.Subject, // TODO
      date: format(new Date(), "YYYY-MM-DD"), // FHIR:date
    });
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
