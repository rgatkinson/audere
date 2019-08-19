// Copyright (c) 2019 by Audere
//
// Use of this source code is governed by an MIT-style license that
// can be found in the LICENSE file distributed with this file.

import { AddressInfo } from "audere-lib/common";
import { GeocodedAddress } from "../geocoding";
import { defineModel, Model, SplitSql, jsonbColumn } from "backend-lib";

export interface SmartyStreetsResponseAttributes {
  id?: number;
  inputAddress: AddressInfo;
  responseAddresses: GeocodedAddress[];
}

export type SmartyStreetsResponseModel = Model<SmartyStreetsResponseAttributes>;

export function defineSmartyStreetsResponse(
  sql: SplitSql
): SmartyStreetsResponseModel {
  return defineModel<SmartyStreetsResponseAttributes>(
    sql.pii,
    "smarty_street_responses",
    {
      inputAddress: jsonbColumn("input_address"),
      responseAddresses: jsonbColumn("response_addresses"),
    }
  );
}
