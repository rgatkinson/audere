// Copyright (c) 2018 by Audere
//
// Use of this source code is governed by an MIT-style license that
// can be found in the LICENSE file distributed with this file.
import { Address } from "../store";

export function checkNotNull<T>(item: T | null | undefined): T {
  if (item == null) {
    if (item === null) {
      throw new Error("item is null");
    } else {
      throw new Error("item is undefined");
    }
  }
  return item;
}

export function isNotNull<T>(item: T | null | undefined): item is T {
  return item != null;
}

export function isValidAddress(address: Address | null | undefined): boolean {
  return (
    address != null &&
    isNotEmptyString(address.firstName) &&
    isNotEmptyString(address.lastName) &&
    isNotEmptyString(address.address) &&
    isNotEmptyString(address.city) &&
    !!address.state &&
    isValidUSZipCode(address.zipcode)
  );
}

export function isValidUSZipCode(zip: string | null | undefined): boolean {
  return zip != null && /^[0-9]{5,5}(-[0-9]{4,4})?$/.test(zip);
}

export function isNotEmptyString(input: string | null | undefined): boolean {
  return !!input && input.trim().length > 0;
}

export function isValidEmail(email: string | undefined): boolean {
  // Top answer in https://stackoverflow.com/questions/46155/how-to-validate-an-email-address-in-javascript
  const validationPattern = /^(([^<>()\[\]\.,;:\s@\"]+(\.[^<>()\[\]\.,;:\s@\"]+)*)|(\".+\"))@(([^<>()[\]\.,;:\s@\"]+\.)+[^<>()[\]\.,;:\s@\"]{2,})$/i;
  return !!email && validationPattern.test(email!);
}

export function isPOBox(address: string | undefined): boolean {
  // https://stackoverflow.com/questions/5680050/po-box-regular-expression-validation
  const validationPattern = /^ *((#\d+)|((box|bin)[-. \/\\]?\d+)|(.*p[ \.]? ?(o|0)[-. \/\\]? *-?((box|bin)|b|(#|num)?\d+))|(p(ost)? *(o(ff(ice)?)?)? *((box|bin)|b)? *\d+)|(p *-?\/?(o)? *-?box)|post office box|((box|bin)|b) *(number|num|#)? *\d+|(num|number|#) *\d+)/i;
  return !!address && validationPattern.test(address);
}
