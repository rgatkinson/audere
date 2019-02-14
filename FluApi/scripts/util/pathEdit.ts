// Copyright (c) 2018 by Audere
//
// Use of this source code is governed by an MIT-style license that
// can be found in the LICENSE file distributed with this file.

// Inspired by discussion at
// https://stackoverflow.com/questions/6393943/convert-javascript-string-in-dot-notation-into-an-object-reference

export function partPath(path: string): string[] {
  return path.match(/[^.\[\]]+/g);
}

export function getPart(obj: object, path: string[]): any {
  return path.reduce(get1, obj);
}

export function setPart(obj: object, path: string[], value: any): any {
  const spine = path.reduce(
    (acc, x) => [ ...acc, get1(acc[acc.length - 1], x) ],
    [obj]
  );
  spine[spine.length - 1] = value;
  return spine.reduceRight((acc, x, i) => set1(x, path[i], acc));
}

export function get1(thing: object, field: string) {
  validateField(thing, field);
  return thing[field];
}

export function set1(thing: object, field: string, value: any): any {
  validateField(thing, field);
  const copy = Array.isArray(thing) ? [ ...thing ] : { ...thing };
  copy[field] = value;
  return copy;
}

export function validateField(thing: object, field: string) {
  if (Array.isArray(thing)) {
    if (Number.isNaN(+field) || (+field < 0) || (+field >= thing.length)) {
      throw new Error(`Expected array index <= '${thing.length}'; got '${field}'`);
    }
  } else {
    if (!thing[field]) {
      throw new Error(`Expected one of '${Object.keys(thing).join("', '")}'; got '${field}'`);
    }
  }
}

function d(x: any): string {
  return JSON.stringify(x);
}
