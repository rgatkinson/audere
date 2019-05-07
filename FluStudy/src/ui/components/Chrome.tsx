// Copyright (c) 2019 by Audere
//
// Use of this source code is governed by an MIT-style license that
// can be found in the LICENSE file distributed with this file.

import React from "react";
import {
  Image,
  ImageBackground,
  ImageSourcePropType,
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
} from "../styles";

interface Props {
  children?: any;
  hideBackButton?: boolean;
  isDemo?: boolean;
  menuItem?: boolean;
  navigation: NavigationScreenProp<any, any>;
  splashImage?: string;
  onBack?: () => void;
}

export default class Chrome extends React.Component<Props> {
  render() {
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
          <StatusBar
            barStyle="light-content"
            backgroundColor="transparent"
            translucent={true}
          />
          <NavigationBar
            demoMode={this.props.isDemo}
            hideBackButton={this.props.hideBackButton}
            menuItem={this.props.menuItem}
            navigation={this.props.navigation}
            onBack={this.props.onBack}
          />
          {!!this.props.splashImage && (
            <Image
              style={styles.image}
              source={{ uri: this.props.splashImage }}
            />
          )}
        </ImageBackground>
        {this.props.children}
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
