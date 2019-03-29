// Copyright (c) 2018 by Audere
//
// Use of this source code is governed by an MIT-style license that
// can be found in the LICENSE file distributed with this file.

import { ResponseInfo, ResponseItemInfo } from "audere-lib/dist/snifflesProtocol";

const PII_RESPONSE_KEYS = new Set([
  "Address",
  "AddressCampus",
  "AddressOtherShelter",
  "AddressCountryResidence",
  "AddressNextWeek",

  // Clarified with principle investigator that bed assignment is not a
  // "direct identifier", and is therefore not considered PII.
  // "BedAssignment",

  "BirthDate",
  "WorkAddress"
]);

export type ResponseInfoMapper = (ResponseInfo) => ResponseInfo;

// Returns a function that maps ResponseInfo to ResponseInfo containing a filtered
// set of responses.  If allowPII is true, the function keeps only PII responses.
// If allowPII is false, the function keeps only non-PII responses.
export function filterResponsePII(allowPII: boolean): ResponseInfoMapper {
  function mapResponse(response: ResponseInfo): ResponseInfo {
    return {
      id: response.id,
      item: (response.item || []).filter(matchResponseItem)
    };
  }

  function matchResponseItem(item: ResponseItemInfo): boolean {
    return PII_RESPONSE_KEYS.has(item.id) === allowPII;
  }

  return mapResponse;
}
