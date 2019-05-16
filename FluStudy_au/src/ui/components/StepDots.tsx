// Copyright (c) 2019 by Audere
//
// Use of this source code is governed by an MIT-style license that
// can be found in the LICENSE file distributed with this file.

import React from "react";
import { View, StyleSheet } from "react-native";
import { GUTTER, PRIMARY_COLOR, SMALL_TEXT } from "../styles";

function renderDots(step: number, total: number) {
  let dots = [];
  for (let i = 1; i <= total; i++) {
    dots.push(
      <View
        key={`dot-${i}`}
        style={[styles.dot, i === step && { backgroundColor: PRIMARY_COLOR }]}
      />
    );
  }
  return dots;
}

const StepDots = (props: any) => {
  const { step, total } = props;
  return (
    <View style={[styles.container, { width: total * SMALL_TEXT * 1.5 }]}>
      {renderDots(step, total)}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: GUTTER / 2,
  },
  dot: {
    backgroundColor: "lightgrey",
    borderRadius: 15,
    height: SMALL_TEXT,
    width: SMALL_TEXT,
  },
});

export default StepDots;
