// Copyright (c) 2019 by Audere
//
// Use of this source code is governed by an MIT-style license that
// can be found in the LICENSE file distributed with this file.

// Assuming:
//   let a: A;
//   let b: B;
// TypeScript considers the expression `[a,b]` to have type `(A|B)[]` rather
// than `[A,B]`.  These are trivial wrappers to specify the tuple type.

export function tuple2<A, B>(a: A, b: B): [A, B] {
  return [a, b];
}

export function tuple3<A, B, C>(a: A, b: B, c: C): [A, B, C] {
  return [a, b, c];
}
