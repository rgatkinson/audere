// Copyright (c) 2019 by Audere
//
// Use of this source code is governed by an MIT-style license that
// can be found in the LICENSE file distributed with this file.

import React from "react";
import { Image, StyleSheet, TouchableWithoutFeedback } from "react-native";
import { connect } from "react-redux";
import { Action, setDemo, StoreState } from "../../store";
import { ASPECT_RATIO, GUTTER, IMAGE_WIDTH } from "../styles";
import MultiTapContainer from "./MultiTapContainer";

interface Props {
  isDemo: boolean;
  menuItem?: boolean;
  uri: string;
  dispatch(action: Action): void;
}

class MainImage extends React.Component<Props> {
  render() {
    const { menuItem, uri } = this.props;
    return (
      <MultiTapContainer
        active={!!this.props.menuItem}
        taps={3}
        onMultiTap={() => this.props.dispatch(setDemo(!this.props.isDemo))}
      >
        <Image
          style={[styles.image, menuItem && styles.menuImage]}
          source={{ uri }}
        />
      </MultiTapContainer>
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
  menuImage: {
    aspectRatio: 4.23,
    width: "80%",
  },
});
