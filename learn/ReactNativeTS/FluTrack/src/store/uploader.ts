// Copyright (c) 2018 by Audere
//
// Use of this source code is governed by an MIT-style license that
// can be found in the LICENSE file distributed with this file.

import { Middleware, MiddlewareAPI, Dispatch, AnyAction } from "redux";
import { default as user, UserState, UserAction } from "./user";
import {
  default as form,
  FormState,
  FormAction,
  SurveyResponse,
  Address,
} from "./form";
import { StoreState } from "./StoreState";
import { DocumentUploader, createUploader } from "../transport";

// This is similar to the logger example at
// https://redux.js.org/api/applymiddleware

const uploader = createUploader();

export function uploaderMiddleware({ getState }: MiddlewareAPI) {
  return (next: Dispatch) => (action: AnyAction) => {
    const result = next(action);
    const state = getState();
    if (state.form != null) {
      uploader.save(state.form.formId, redux_to_pouch(state));
    }
    return result;
  };
}

function addressInputToPouchAddress(addressInput?: Address): AddressType {
  if (!addressInput) {
    return {};
  }
  let pouchAddress: AddressType = {
    city: addressInput!.city,
    state: addressInput!.state,
    postalCode: addressInput!.zipcode,
    country: addressInput!.country,
  };
  pouchAddress.line = [];
  if (!!addressInput.location) {
    pouchAddress.line.push(addressInput.location);
  }
  if (!!addressInput.address) {
    pouchAddress.line.push(addressInput.address);
  }
  return pouchAddress;
}

// Exported so we can write unit tests for this
export function redux_to_pouch(state: StoreState): PouchDoc {
  const pouch: PouchDoc = {
    patient: {
      telecom: [],
      address: [],
      responses: [],
    },
  };
  const form = state.form;
  if (form != null) {
    const responses = form.surveyResponses;
    if (!!responses && responses instanceof Map) {
      //TODO Set patient name in surveyResponses
      if (responses.has("patient.name")) {
        pouch.patient.name = responses.get("patient.name")!.answer!.textInput;
      }
      //TODO Set patient email in surveyResponses
      if (responses.has("patient.email")) {
        pouch.patient.telecom.push({
          system: "email",
          value: responses.get("patient.email")!.answer!.textInput,
        });
      }
      if (responses.has("Address")) {
        pouch.patient.address.push({
          use: "home",
          ...addressInputToPouchAddress(
            responses.get("Address")!.answer!.addressInput
          ),
        });
      }
      if (responses.has("WorkAddress")) {
        pouch.patient.address.push({
          use: "work",
          ...addressInputToPouchAddress(
            responses.get("WorkAddress")!.answer!.addressInput
          ),
        });
      }
      if (responses.has("AssignedSex")) {
        let buttonKey = responses.get("AssignedSex")!.answer!.selectedButtonKey;
        switch (buttonKey) {
          case "male":
          case "female":
          case "other":
            pouch.patient.gender = buttonKey;
            break;
          default:
            // Prefer not to say
            pouch.patient.gender = "unknown";
        }
      }
      //Set all surveyResponses into pouch.patient.responses
      let items: ItemType[] = [];
      for (const [key, value] of responses.entries()) {
        let item: ItemType = {
          id: key,
          text: value!.questionText,
          answer: [],
        };
        const surveyAnswer = value.answer;
        if (!surveyAnswer) {
          continue;
        }
        let answerOptions: { id: string; text?: string }[] = [];
        const options = surveyAnswer.options;
        if (!!options) {
          // TODO Change this to optionKeyToLabel after Jenny is done
          for (const option of options.keys()) {
            answerOptions.push({ id: option, text: option });
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
                text: buttonOptions.get(button),
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
            if (!!options && surveyAnswer.selectedButtonKey === "done") {
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
          if (surveyAnswer.addressInput) {
            item.answer.push({
              valueAddress: addressInputToPouchAddress(
                surveyAnswer.addressInput
              ),
            });
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
      console.log(items);
      pouch.patient.responses.push({ id: "Questionnaire", item: items });
    }
  }
  return pouch;
}

type AddressType = {
  line?: string[];
  city?: string;
  state?: string;
  postalCode?: string;
  country?: string;
};

type ItemType = {
  // human-readable, locale-independent id of the question
  id: string;
  // localized text of question
  text?: string;
  // For multiple-choice questions, the exact text of each option, in order
  answerOptions?: {
    id: string;
    text?: string;
  }[];
  answer: {
    valueBoolean?: boolean;
    valueDateTime?: string; // FHIR:dateTime
    valueDecimal?: number;
    valueInteger?: number;
    valueString?: string;
    valueAddress?: AddressType;
    valueOther?: {
      // Index in answerOptions of the selected choice
      selectedIndex: Number;
      valueString: String;
    };
    valueDeclined?: boolean;
  }[];
};

type PouchDoc = {
  patient: {
    name?: string;
    birthDate?: string; // FHIR:date
    gender?: "male" | "female" | "other" | "unknown";
    telecom: { system: "phone" | "sms" | "email"; value?: string }[];
    address: ({ use: "home" | "work" } & AddressType)[];
    consent?: {
      terms: string;
      name: string;
      date: string;
      // Base64-encoded PNG of their signature
      signature: string;
    };
    responses: {
      id: string;
      item: ItemType[];
    }[];
    // TODO: add events: []
  };
};
