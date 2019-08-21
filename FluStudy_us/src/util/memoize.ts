// Copyright (c) 2019 by Audere
//
// Use of this source code is governed by an MIT-style license that
// can be found in the LICENSE file distributed with this file.

// Returns a wrapper for a function that will only call the inner function
// once (assuming the inner function does not throw), and then will return
// the cached value thereafter without calling again.
//
// If the inner call does throw, the Error is propagated to the caller, and
// the next wrapper call will retry the inner call.
export function memoize<T>(call: () => T): () => T {
  let called = false;
  let value: any;

  return () => {
    if (!called) {
      value = call();
      called = true;
    }
    return value;
  };
}
