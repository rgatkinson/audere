// Copyright (c) 2019 by Audere
//
// Use of this source code is governed by an MIT-style license that
// can be found in the LICENSE file distributed with this file.

import React from "react";
import { Image, StyleSheet, View } from "react-native";

const ScreenImages = (props: any) => {
  return (
    <View style={styles.imagesContainer}>
      {props.images!.map((uri: string, index: number) => {
        return (
          <Image
            resizeMode={"contain"}
            style={{ flex: 1, height: undefined, width: undefined }}
            key={`${uri}-${index}`}
            source={{ uri }}
          />
        );
      })}
    </View>
  );
};

export default ScreenImages;

const styles = StyleSheet.create({
  imagesContainer: {
    flex: 1,
  },
});
