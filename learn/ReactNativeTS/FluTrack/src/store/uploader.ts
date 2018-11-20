// Copyright (c) 2018 by Audere
//
// Use of this source code is governed by an MIT-style license that
// can be found in the LICENSE file distributed with this file.

import { Middleware, MiddlewareAPI, Dispatch, AnyAction } from "redux";
import { default as user, UserState, UserAction } from "./user";
import { default as form, FormState, FormAction, SurveyResponse } from "./form";
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
          line: [responses.get("Address")!.answer!.addressInput!.address],
          city: responses.get("Address")!.answer!.addressInput!.city,
          state: responses.get("Address")!.answer!.addressInput!.state,
          postalCode: responses.get("Address")!.answer!.addressInput!.zipcode,
          country: responses.get("Address")!.answer!.addressInput!.country,
        });
      }
      if (responses.has("WorkAddress")) {
        pouch.patient.address.push({
          use: "work",
          line: [
            responses.get("WorkAddress")!.answer!.addressInput!.location,
            responses.get("WorkAddress")!.answer!.addressInput!.address,
          ],
          city: responses.get("WorkAddress")!.answer!.addressInput!.city,
          state: responses.get("WorkAddress")!.answer!.addressInput!.state,
          postalCode: responses.get("WorkAddress")!.answer!.addressInput!
            .zipcode,
          country: responses.get("WorkAddress")!.answer!.addressInput!.country,
        });
      }
      if (responses.has("AssignedSex")) {
        switch (responses.get("AssignedSex")!.answer!.selectedButtonLabel) {
          // What happens when we localize??
          case "Male":
            pouch.patient.gender = "male";
            break;
          case "Female":
            pouch.patient.gender = "female";
            break;
          default:
            pouch.patient.gender = "unknown";
        }
      }
      //TODO: Set pouch.patient.responses[] with surveyResponses after
      //      surveyResponses is modified to more closely match responses[]
    }
  }
  return pouch;
}

type PouchDoc = {
  patient: {
    name?: string;
    birthDate?: string; // FHIR:date
    gender?: "male" | "female" | "other" | "unknown";
    telecom: [{ system: string; value?: string }?];
    address: [
      {
        use: "home" | "work";
        line?: (string | undefined)[];
        city?: string;
        state?: string;
        postalCode?: string;
        country?: string;
      }?
    ];
    consent?: {
      terms: string;
      name: string;
      date: string;
      // Base64-encoded PNG of their signature
      signature: string;
    };
    responses?: [
      {
        // This is loosely based on the FHIR 'QuestionnaireResponse' resource
        // https://www.hl7.org/fhir/questionnaireresponse.html

        id: string;
        item: [
          {
            // human-readable, locale-independent id of the question
            id: string;
            // localized text of question
            text: string;
            // For multiple-choice questions, the exact text of each option, in order
            answerOptions?: [
              {
                id: string;
                text: string;
              }
            ];
            // 0 or 1 of these should be included
            answer: [
              {
                valueBoolean?: boolean;
                valueDateTime?: string; // FHIR:dateTime
                valueDecimal?: number;
                valueInteger?: number;
                valueString?: string;
              }
            ];
          }
        ];
      }?
    ];
    // TODO: add events: []
  };
};
