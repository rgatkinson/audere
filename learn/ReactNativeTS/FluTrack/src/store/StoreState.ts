// Copyright (c) 2018 by Audere
//
// Use of this source code is governed by an MIT-style license that
// can be found in the LICENSE file distributed with this file.

import { default as user, UserState, UserAction } from "./user";
import { default as form, FormState, FormAction } from "./form";

export interface StoreState {
  user: UserState;
  form: FormState;
}