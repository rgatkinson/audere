// Copyright (c) 2020 by Audere
//
// Use of this source code is governed by an MIT-style license that
// can be found in the LICENSE file distributed with this file.

export interface ImportProblem {
  id?: string;
  firebaseId: string;
  firebaseCollection: string;
  attempts: number;
  lastError: string;
}
