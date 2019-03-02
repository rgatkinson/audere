// Copyright (c) 2018 by Audere
//
// Use of this source code is governed by an MIT-style license that
// can be found in the LICENSE file distributed with this file.

export function isAWS() {
  return process.env.NODE_ENV in ["production", "staging"];
}

export function isProduction() {
  return process.env.NODE_ENV === "production";
}