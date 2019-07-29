// Copyright (c) 2019 by Audere
//
// Use of this source code is governed by an MIT-style license that
// can be found in the LICENSE file distributed with this file.

export function getRoot() {
  return document.getElementById("root");
}

export function localeDate(timestamp: string): string {
  return date(timestamp).toLocaleString();
}

export function date(timestamp: string): Date {
  if (/^[0-9]+$/.test(timestamp)) {
    return new Date(Number.parseInt(timestamp));
  } else {
    return new Date(timestamp);
  }
}

export function last<T>(array: Array<T>): T | null {
  if (array.length === 0) {
    return null;
  } else {
    return array[array.length - 1];
  }
}
