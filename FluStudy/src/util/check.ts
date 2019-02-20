// Copyright (c) 2018 by Audere
//
// Use of this source code is governed by an MIT-style license that
// can be found in the LICENSE file distributed with this file.

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

export function isValidUSZipCode(zip: string | null | undefined): boolean {
  return zip != null && /^[0-9]{5,5}(-[0-9]{4,4})?$/.test(zip);
}
