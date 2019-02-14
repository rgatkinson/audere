// Copyright (c) 2018 by Audere
//
// Use of this source code is governed by an MIT-style license that
// can be found in the LICENSE file distributed with this file.

import {
  getPart,
  setPart,
  partPath,
  get1,
  set1,
  validateField
} from "../../scripts/util/pathEdit";

describe("partPath", () => {
  it("Separates dotted paths", () => {
    expect(partPath("a.b.c")).toEqual(["a", "b", "c"]);
  });
  it("Separates array paths", () => {
    expect(partPath("a[5][10]")).toEqual(["a", "5", "10"]);
  });
  it("Separates mixed paths", () => {
    expect(partPath("a.b[5].c[10]")).toEqual(["a", "b", "5", "c", "10"]);
  });
});

describe("get1", () => {
  it("gets object field", () => {
    expect(get1({a: 5}, "a")).toEqual(5);
  });
  it("gets array index", () => {
    expect(get1([4,5,6], "1")).toEqual(5);
  })
});

describe("set1", () => {
  it("sets an object field", () => {
    expect(set1({a: 5}, "a", 10)).toEqual({a: 10});
  });
  it("sets an array index", () => {
    expect(set1([4,5,6], "1", 10)).toEqual([4,10,6]);
  });
});

describe("getPart", () => {
  it("gets by field path", () => {
    expect(getPart({a: {b: {c: 3}}}, partPath("a.b.c"))).toEqual(3);
  });
  it("gets by array index", () => {
    expect(getPart([0, [1, [2, 3]]], partPath("1.1.1"))).toEqual(3);
  });
  it("gets by mixed path", () => {
    const obj = {
      a: [
        0, 1, {
          b: [
            2, 3, 4, {
              c: 5
            }
          ]
        }
      ]
    };
    expect(getPart(obj, partPath("a[2].b[3].c"))).toEqual(5);
  });
});

describe("setPart", () => {
  it("sets top level object field", () => {
    const obj = {
      a: 5
    };
    expect(setPart(obj, partPath("a"), 10)).toEqual({ a: 10 });
  });
  it("sets top level array index", () => {
    const obj = [ "a", "b", "c" ];
    expect(setPart(obj, partPath("1"), "z")).toEqual(["a", "z", "c" ]);
  });
  it("sets by mixed path", () => {
    const obj = {
      a: "a",
      b: [
        "b", "c", {
          d: {
            e: [
              1, 2, []
            ]
          }
        }
      ]
    }
    expect(setPart(obj, partPath("b"), 42)).toEqual({a:"a", b:42});
    expect(setPart(obj, partPath("b[2]"), 42)).toEqual({
      a: "a",
      b: [ "b", "c", 42]
    });
    expect(setPart(obj, partPath("b[2].d"), 42)).toEqual({
      a: "a",
      b: [
        "b", "c", {
          d: 42
        }
      ]
    });
  });
});
