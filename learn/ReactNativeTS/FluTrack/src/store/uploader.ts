// Copyright (c) 2018 by Audere
//
// Use of this source code is governed by an MIT-style license that
// can be found in the LICENSE file distributed with this file.

import { Middleware, MiddlewareAPI } from "redux"
import { default as user, UserState, UserAction } from "./user";
import { default as form, FormState, FormAction } from "./form";
import { StoreState } from "./StoreState"
import { DocumentUploader, createUploader } from "../transport"

// This is similar to the logger example at
// https://redux.js.org/api/applymiddleware

const uploader = createUploader();

// TODO Terri correct type signature
export function uploaderMiddleware({getState}: any): any {
  // TODO Terri correct type signature
  return (next: any) => (action: any) => {
    const result = next(action);
    const state = getState();
    uploader.save(state.form.formId, redux_to_pouch(state))
    return result;
  }
}

// Exported so we can write unit tests for this
export function redux_to_pouch(state: StoreState): PouchDoc {
  const pouch: PouchDoc = {
    patient: {
      telecom: [],
      address: [],
    }
  };
  const form = state.form;
  if (form != null) {
    const responses = form.surveyResponses;
    if (responses != null) {
      if (responses.has("patient.name")) {
        pouch.patient.name = responses.get("patient.name")!.answer!.textInput;
      }
      if (responses.has("patient.email")) {
        pouch.patient.telecom.push({
          system: "email",
          value: responses.get("patient.email")!.answer!.textInput,
        });
      }
    }
  }
  return pouch;
}

// TODO Terri
type PouchDoc = any;
