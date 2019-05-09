// Copyright (c) 2018 by Audere
//
// Use of this source code is governed by an MIT-style license that
// can be found in the LICENSE file distributed with this file.
export function isNotNull<T>(item: T | null | undefined): item is T {
  return item != null;
}

export function isValidEmail(email: string | undefined): boolean {
  // Top answer in https://stackoverflow.com/questions/46155/how-to-validate-an-email-address-in-javascript
  const validationPattern = /^(([^<>()\[\]\.,;:\s@\"]+(\.[^<>()\[\]\.,;:\s@\"]+)*)|(\".+\"))@(([^<>()[\]\.,;:\s@\"]+\.)+[^<>()[\]\.,;:\s@\"]{2,})$/i;
  return !!email && validationPattern.test(email!);
}
