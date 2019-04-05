import { AddressInfoUse, AddressInfo } from "audere-lib/snifflesProtocol";
import { Sequelize } from "sequelize";
import { GeocodedAddress } from "../geocoding";
import {
  defineModel,
  Model,
  SplitSql,
  integerColumn,
  jsonbColumn
} from "../../util/sql";

export interface SmartyStreetsResponseAttributes {
  id?: number;
  inputAddress: AddressInfo;
  maxCandidates: number;
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
      maxCandidates: integerColumn("max_candidates"),
      responseAddresses: jsonbColumn("response_addresses")
    }
  );
}
