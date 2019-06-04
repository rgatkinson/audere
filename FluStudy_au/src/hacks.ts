// Copyright (c) 2019 by Audere
//
// Use of this source code is governed by an MIT-style license that
// can be found in the LICENSE file distributed with this file.

if (process.env.NODE_ENV !== "test") {
  require("react-native-get-random-values");
}

// See https://github.com/facebook/react-native/issues/9599
const scope: any = global;
if (scope && typeof scope.self === "undefined") {
  scope.self = scope;
}

global.Buffer = global.Buffer || require("buffer").Buffer;
