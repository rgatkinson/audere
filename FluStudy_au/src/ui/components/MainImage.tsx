// Copyright (c) 2019 by Audere
//
// Use of this source code is governed by an MIT-style license that
// can be found in the LICENSE file distributed with this file.

import React from "react";
import { Image, StyleSheet, TouchableWithoutFeedback } from "react-native";
import { connect } from "react-redux";
import { Action, setDemo, StoreState } from "../../store";
import { ASPECT_RATIO, GUTTER, IMAGE_WIDTH } from "../styles";

interface Props {
  isDemo: boolean;
  menuItem?: boolean;
  uri: string;
  dispatch?(action: Action): void;
}

const TRIPLE_PRESS_DELAY = 500;

class MainImage extends React.Component<Props> {
  lastTap: number | null = null;
  secondLastTap: number | null = null;

  _handleTripleTap = () => {
    const now = Date.now();
    if (
      this.lastTap != null &&
      this.secondLastTap != null &&
      now - this.secondLastTap! < TRIPLE_PRESS_DELAY &&
      this.props.menuItem
    ) {
      this.props.dispatch!(setDemo(!this.props.isDemo));
    } else {
      this.secondLastTap = this.lastTap;
      this.lastTap = now;
    }
  };

  render() {
    const { menuItem, uri } = this.props;
    return (
      <TouchableWithoutFeedback
        style={styles.imageContainer}
        onPress={this._handleTripleTap}
      >
        <Image
          style={[styles.image, menuItem && styles.menuImage]}
          source={{ uri }}
        />
      </TouchableWithoutFeedback>
    );
  }
}
export default connect((state: StoreState) => {
  return {
    isDemo: state.meta.isDemo,
  };
})(MainImage);

const styles = StyleSheet.create({
  image: {
    alignSelf: "center",
    aspectRatio: ASPECT_RATIO,
    height: undefined,
    marginVertical: GUTTER / 2,
    width: IMAGE_WIDTH,
  },
  imageContainer: {
    alignSelf: "stretch",
  },
  menuImage: {
    aspectRatio: 4.23,
    width: "80%",
  },
});
