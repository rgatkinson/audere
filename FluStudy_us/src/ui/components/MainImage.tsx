// Copyright (c) 2019 by Audere
//
// Use of this source code is governed by an MIT-style license that
// can be found in the LICENSE file distributed with this file.

import React from "react";
import {
  Dimensions,
  Image,
  StyleSheet,
  StyleProp,
  ImageStyle,
} from "react-native";
import { connect } from "react-redux";
import { Action, setDemo, StoreState } from "../../store";
import {
  ASPECT_RATIO,
  GUTTER,
  IMAGE_WIDTH,
  IMAGE_MARGIN,
  SCREEN_MARGIN,
  IMAGE_WIDTH_SQUARE,
} from "../styles";
import MultiTapContainer from "./MultiTapContainer";

interface Props {
  imageStyle?: StyleProp<ImageStyle>;
  isDemo: boolean;
  menuItem?: boolean;
  uri: string;
  useForChrome?: boolean;
  dispatch(action: Action): void;
}

class MainImage extends React.Component<Props> {
  _toggleDemoMode = () => {
    this.props.dispatch(setDemo(!this.props.isDemo));
  };

  render() {
    const { imageStyle, menuItem, uri, useForChrome } = this.props;
    const image = (
      <Image
        style={[
          styles.image,
          useForChrome && styles.useForChrome,
          menuItem && styles.menuImage,
          imageStyle && imageStyle,
        ]}
        source={{ uri }}
      />
    );

    return !!menuItem ? (
      <MultiTapContainer
        active={true}
        taps={3}
        onMultiTap={this._toggleDemoMode}
      >
        {image}
      </MultiTapContainer>
    ) : (
      image
    );
  }
}
export default connect((state: StoreState) => {
  return {
    isDemo: state.meta.isDemo,
  };
})(MainImage);

const screenWidth = Dimensions.get("window").width;

const styles = StyleSheet.create({
  image: {
    alignSelf: "center",
    aspectRatio: ASPECT_RATIO,
    height: undefined,
    marginTop: IMAGE_MARGIN,
    marginBottom: IMAGE_MARGIN / 2,
    resizeMode: "contain",
    width: IMAGE_WIDTH,
  },
  useForChrome: {
    aspectRatio: 1,
    marginVertical: GUTTER * 0.75,
    width:
      parseInt(IMAGE_WIDTH_SQUARE) *
        (screenWidth / (screenWidth - SCREEN_MARGIN * 2)) +
      "%",
  },
  menuImage: {
    aspectRatio: 4.23,
    width: "80%",
  },
});
