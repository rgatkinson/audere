// Copyright (c) 2019 by Audere
//
// Use of this source code is governed by an MIT-style license that
// can be found in the LICENSE file distributed with this file.

// Common styles go here

import { StyleSheet } from "react-native";

export const colors = {
  accent: "#36b3a8", // Audere button color
  disabledText: "#aaa",
};

export default StyleSheet.create({
  formLayout: {
    flex: 1,
    alignSelf: "stretch",
    justifyContent: "flex-start",
  },
});
