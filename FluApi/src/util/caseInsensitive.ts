// Copyright (c) 2019 by Audere
//
// Use of this source code is governed by an MIT-style license that
// can be found in the LICENSE file distributed with this file.

import logger from "../util/logger";

/**
 * Case-insensitive property get from an object. Returns `undefined` if the key
 * is not present.
 *
 * @param key Property to retrieve
 * @param obj Object to retrieve value from
 */
export function getByKey(key: string, obj: any): any {
  const casedKey = searchKey(key, obj);

  if (casedKey != null) {
    return obj[casedKey];
  } else {
    return undefined;
  }
}

/**
 * Case-insensitive search for matching object key. Returns `undefined` if the
 * key is not present.
 *
 * @param key Key to find
 * @param obj Object to search
 */
export function searchKey(key: string, obj: any): string | null {
  const keys = Object.keys(obj);
  const match = keys.find(k => k.toLowerCase() === key.toLowerCase());

  if (match == null) {
    logger.warn(`Key ${key} was not found in passed object`);
  }

  return match;
}

/**
 * Case-insensitive search for matching object keys. Returns `undefined` if the
 * key is not present. Returns
 *
 * @param key Key to find
 * @param obj Object to search
 */
export function searchKeys(keys: string[], obj: any): string | null {
  const objKeys = Object.keys(obj);
  const match = objKeys.find(objKey =>
    keys.some(searchKey => searchKey.toLowerCase() === objKey.toLowerCase())
  );

  if (match == null) {
    logger.warn(`Keys ${keys.join(", ")} were not found in passed object`);
  }

  return match;
}
