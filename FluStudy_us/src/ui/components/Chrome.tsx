// Copyright (c) 2019 by Audere
//
// Use of this source code is governed by an MIT-style license that
// can be found in the LICENSE file distributed with this file.

import React from "react";
import {
  Dimensions,
  Image,
  ImageBackground,
  StatusBar,
  StyleSheet,
  View,
} from "react-native";
import { NavigationScreenProp } from "react-navigation";
import { Action } from "redux";
import {
  GUTTER,
  IMAGE_WIDTH_SQUARE,
  isTablet,
  NAV_BAR_HEIGHT,
  PRIMARY_COLOR,
  SPLASH_IMAGE,
  SPLASH_RATIO,
  STATUS_BAR_HEIGHT,
  SYSTEM_PADDING_BOTTOM,
} from "../styles";
import NavigationBar from "./NavigationBar";

interface Props {
  children?: any;
  hasBeenOpened?: boolean;
  hideBackButton?: boolean;
  menuItem?: boolean;
  navigation: NavigationScreenProp<any, any>;
  onBack?: (
    nav: NavigationScreenProp<any, any>,
    dispatch: (action: Action) => void
  ) => void;
  splashImage?: string;
  showBackgroundOnly?: boolean;
}

export default class Chrome extends React.PureComponent<Props> {
  render() {
    const {
      children,
      hideBackButton,
      menuItem,
      navigation,
      splashImage,
      showBackgroundOnly,
    } = this.props;

    const screenHeight = Dimensions.get("window").height;
    const screenWidth = Dimensions.get("window").width;
    const chromeBgHeight = screenWidth / SPLASH_RATIO;

    return (
      <View style={styles.container}>
        <ImageBackground
          source={SPLASH_IMAGE}
          style={[
            {
              width: screenWidth,
              height: NAV_BAR_HEIGHT + STATUS_BAR_HEIGHT,
            },
            (!!this.props.splashImage || showBackgroundOnly) && {
              height: chromeBgHeight,
              aspectRatio: SPLASH_RATIO,
            },
          ]}
        >
          <View
            style={[
              {
                width: screenWidth,
                height: !!splashImage
                  ? chromeBgHeight * 0.8
                  : NAV_BAR_HEIGHT + STATUS_BAR_HEIGHT,
              },
            ]}
          >
            <StatusBar
              backgroundColor="transparent"
              barStyle="light-content"
              translucent={true}
            />
            <NavigationBar
              onBack={this.props.onBack}
              hideBackButton={hideBackButton}
              menuItem={menuItem}
              navigation={navigation}
            />

            {!!splashImage && (
              <Image style={styles.image} source={{ uri: splashImage }} />
            )}
          </View>
        </ImageBackground>

        <View
          style={[
            (!!splashImage || showBackgroundOnly) && styles.alignBottom,
            {
              height:
                !!splashImage && !showBackgroundOnly
                  ? screenHeight -
                    chromeBgHeight -
                    (isTablet ? NAV_BAR_HEIGHT : 0)
                  : screenHeight - NAV_BAR_HEIGHT - STATUS_BAR_HEIGHT,
              width: "100%",
            },
          ]}
        >
          {children}
        </View>
      </View>
    );
  }
}

const styles = StyleSheet.create({
  alignBottom: {
    position: "absolute",
    bottom: 0,
  },
  container: {
    backgroundColor: PRIMARY_COLOR,
    flex: 1,
    paddingBottom: SYSTEM_PADDING_BOTTOM,
  },
  image: {
    alignSelf: "center",
    aspectRatio: 1,
    height: undefined,
    marginTop: GUTTER,
    width: IMAGE_WIDTH_SQUARE,
  },
});
