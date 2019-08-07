// Copyright (c) 2019 by Audere
//
// Use of this source code is governed by an MIT-style license that
// can be found in the LICENSE file distributed with this file.

import React from "react";
import { Dimensions, Image, StatusBar, StyleSheet, View } from "react-native";
import { NavigationScreenProp } from "react-navigation";
import NavigationBar from "./NavigationBar";
import {
  ASPECT_RATIO,
  IMAGE_WIDTH,
  SPLASH_IMAGE,
  SPLASH_RATIO,
  SYSTEM_PADDING_BOTTOM,
  NAV_BAR_HEIGHT,
  STATUS_BAR_HEIGHT,
  isTablet,
} from "../styles";

interface Props {
  children?: any;
  hasBeenOpened?: boolean;
  hideBackButton?: boolean;
  menuItem?: boolean;
  navigation: NavigationScreenProp<any, any>;
  splashImage?: string;
}

export default class Chrome extends React.PureComponent<Props> {
  render() {
    const {
      children,
      hideBackButton,
      menuItem,
      navigation,
      splashImage,
    } = this.props;

    const screenHeight = Dimensions.get("window").height;
    const screenWidth = Dimensions.get("window").width;
    const chromeBgHeight = screenWidth / SPLASH_RATIO;

    return (
      <View style={styles.container}>
        <View style={styles.topContainer}>
          <Image
            source={SPLASH_IMAGE}
            style={[
              styles.alignTop,
              {
                width: screenWidth,
                height: NAV_BAR_HEIGHT + STATUS_BAR_HEIGHT,
              },
              !!this.props.splashImage && {
                height: undefined,
                aspectRatio: SPLASH_RATIO,
              },
            ]}
          />
          <Image
            resizeMode={"stretch"}
            source={{ uri: "gradient" }}
            style={[
              styles.alignTop,
              {
                width: screenWidth,
                height: splashImage
                  ? chromeBgHeight * 0.8
                  : NAV_BAR_HEIGHT + STATUS_BAR_HEIGHT,
              },
            ]}
          />
        </View>
        <StatusBar
          backgroundColor="transparent"
          barStyle="light-content"
          translucent={true}
        />
        <NavigationBar
          hideBackButton={hideBackButton}
          menuItem={menuItem}
          navigation={navigation}
        />
        {!!splashImage && (
          <Image style={styles.image} source={{ uri: splashImage }} />
        )}

        <View
          style={[
            styles.alignBottom,
            {
              height: !!splashImage
                ? screenHeight -
                  chromeBgHeight -
                  (isTablet ? NAV_BAR_HEIGHT : 0)
                : screenHeight - NAV_BAR_HEIGHT - STATUS_BAR_HEIGHT,
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
  alignTop: {
    position: "absolute",
    top: 0,
  },
  alignBottom: {
    position: "absolute",
    bottom: 0,
  },
  container: {
    backgroundColor: "white",
    flex: 1,
    paddingBottom: SYSTEM_PADDING_BOTTOM,
  },
  image: {
    alignSelf: "center",
    aspectRatio: ASPECT_RATIO,
    height: undefined,

    width: IMAGE_WIDTH,
  },
  shortImage: {
    aspectRatio: 4.23,
    width: "75%",
  },
  topContainer: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
  },
});
