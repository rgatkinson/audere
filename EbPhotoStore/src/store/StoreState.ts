// Copyright (c) 2018 by Audere
//
// Use of this source code is governed by an MIT-style license that
// can be found in the LICENSE file distributed with this file.

import { default as meta, MetaState } from "./meta";
import { default as patients, PatientState } from "./patients";
import { PhotoUploadsState } from "./photoUploads";

export interface StoreState {
  meta: MetaState;
  patients: PatientState;
  photoUploads: PhotoUploadsState;
}
