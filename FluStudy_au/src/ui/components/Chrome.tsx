// Copyright (c) 2019 by Audere
//
// Use of this source code is governed by an MIT-style license that
// can be found in the LICENSE file distributed with this file.

import React from "react";
import {
  Image,
  ImageBackground,
  StatusBar,
  StyleSheet,
  View,
} from "react-native";
import { NavigationScreenProp } from "react-navigation";
import NavigationBar from "./NavigationBar";
import {
  ASPECT_RATIO,
  GUTTER,
  IMAGE_WIDTH,
  SPLASH_IMAGE,
  SPLASH_RATIO,
  SYSTEM_PADDING_BOTTOM,
  NAV_BAR_HEIGHT,
  STATUS_BAR_HEIGHT,
} from "../styles";

interface Props {
  children?: any;
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
    return (
      <View style={styles.container}>
        <ImageBackground
          source={SPLASH_IMAGE}
          style={[
            { alignSelf: "stretch" },
            !!this.props.splashImage && {
              aspectRatio: SPLASH_RATIO,
              width: "100%",
            },
          ]}
        >
          <Image
            resizeMode={"stretch"}
            source={{ uri: "gradient" }}
            style={{
              position: "absolute",
              left: 0,
              right: 0,
              top: 0,
              height: splashImage ? 300 : NAV_BAR_HEIGHT + STATUS_BAR_HEIGHT,
            }}
          />
          <StatusBar
            barStyle="light-content"
            backgroundColor="transparent"
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
        </ImageBackground>
        {children}
      </View>
    );
  }
}

const styles = StyleSheet.create({
  container: {
    alignSelf: "stretch",
    backgroundColor: "white",
    flex: 1,
    paddingBottom: SYSTEM_PADDING_BOTTOM,
  },
  image: {
    alignSelf: "center",
    aspectRatio: ASPECT_RATIO,
    height: undefined,
    marginVertical: GUTTER / 2,
    width: IMAGE_WIDTH,
  },
  shortImage: {
    aspectRatio: 4.23,
    width: "75%",
  },
});
