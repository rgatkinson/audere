// Copyright (c) 2019 by Audere
//
// Use of this source code is governed by an MIT-style license that
// can be found in the LICENSE file distributed with this file.

import React from "react";
import {
  Animated,
  Image,
  ImageBackground,
  StatusBar,
  StyleSheet,
  View,
  Dimensions,
} from "react-native";
import { NavigationScreenProp } from "react-navigation";
import NavigationBar from "./NavigationBar";
import {
  ASPECT_RATIO,
  IMAGE_WIDTH,
  SYSTEM_PADDING_BOTTOM,
  NAV_BAR_HEIGHT,
  STATUS_BAR_HEIGHT,
} from "../styles";
import { Action } from "../../store";
import { connect } from "react-redux";

interface Props {
  children?: any;
  dispatch(action: Action): void;
  dispatchOnFirstLoad?: () => Action;
  hasBeenOpened?: boolean;
  hideBackButton?: boolean;
  menuItem?: boolean;
  navigation: NavigationScreenProp<any, any>;
  splashImage?: string;
}

const screenHeight = Dimensions.get("window").height;

class AnimatedChrome extends React.PureComponent<Props> {
  state = {
    imageFadeAnim: new Animated.Value(0),
    textFadeAnim: new Animated.Value(0),
    logoFadeAnim: new Animated.Value(1),
    splashMoveAnim: new Animated.Value(0),
    navBarMoveAnim: new Animated.Value(0),
    navBarFadeAnim: new Animated.Value(0),
  };

  componentDidMount() {
    const { dispatchOnFirstLoad, hasBeenOpened } = this.props;
    const {
      logoFadeAnim,
      splashMoveAnim,
      imageFadeAnim,
      navBarFadeAnim,
      navBarMoveAnim,
      textFadeAnim,
    } = this.state;

    if (!hasBeenOpened) {
      Animated.sequence([
        Animated.parallel([
          Animated.timing(logoFadeAnim, {
            toValue: 0,
            duration: 2000,
            useNativeDriver: true,
          }),
          Animated.timing(splashMoveAnim, {
            toValue: 1,
            duration: 2300,
            useNativeDriver: true,
          }),
          Animated.timing(navBarMoveAnim, {
            toValue: 1,
            duration: 2300,
            useNativeDriver: true,
          }),
          Animated.timing(navBarFadeAnim, {
            toValue: 1,
            duration: 2300,
            useNativeDriver: true,
          }),
        ]),
        Animated.sequence([
          Animated.timing(imageFadeAnim, {
            toValue: 1,
            duration: 500,
            useNativeDriver: true,
          }),
          Animated.timing(textFadeAnim, {
            toValue: 1,
            duration: 700,
            useNativeDriver: true,
          }),
        ]),
      ]).start(
        () =>
          !!dispatchOnFirstLoad && this.props.dispatch(dispatchOnFirstLoad())
      );
    }
  }

  getSplashImageSize() {
    const sizes = [
      { width: 330, height: 743 },
      { width: 385, height: 866 },
      { width: 424, height: 954 },
      { width: 840, height: 1890 },
      { width: 1024, height: 2304 },
      { width: 1400, height: 3150 },
    ];

    let prev = sizes[0];
    let idx = 1;
    while (idx < sizes.length && sizes[idx].height < screenHeight) {
      prev = sizes[idx];
      idx++;
    }

    return prev;
  }

  render() {
    const {
      children,
      hideBackButton,
      menuItem,
      navigation,
      splashImage,
    } = this.props;

    const splashImageDimensions = this.getSplashImageSize();

    return (
      <View style={styles.container}>
        <Animated.View
          style={[
            {
              position: "absolute",
              height: splashImageDimensions.height + screenHeight,
              width: "100%",
              transform: [
                {
                  translateY: this.state.splashMoveAnim.interpolate({
                    inputRange: [0, 1],
                    outputRange: [
                      0,
                      -splashImageDimensions.height -
                        screenHeight / 3 -
                        NAV_BAR_HEIGHT,
                    ],
                  }),
                },
              ],
            },
          ]}
        >
          <ImageBackground
            source={{
              uri: `bg_${splashImageDimensions.width}x${splashImageDimensions.height}`,
            }}
            style={[
              {
                height: "100%",
              },
            ]}
          >
            <Image
              resizeMode={"stretch"}
              source={{ uri: "gradient" }}
              style={[
                {
                  alignSelf: "stretch",
                  height: "100%",
                },
              ]}
            />
          </ImageBackground>
        </Animated.View>
        <Animated.View
          style={{
            opacity: this.state.navBarFadeAnim,
            transform: [
              {
                translateY: this.state.navBarMoveAnim.interpolate({
                  inputRange: [0, 1],
                  outputRange: [-20, 0],
                }),
              },
            ],
          }}
        >
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
        </Animated.View>
        {!!splashImage && (
          <Animated.Image
            style={[
              styles.image,
              {
                opacity: this.state.imageFadeAnim,
                position: "absolute",
                top: NAV_BAR_HEIGHT + STATUS_BAR_HEIGHT,
              },
            ]}
            source={{ uri: splashImage }}
          />
        )}
        <Animated.Image
          style={{
            top: screenHeight / 8,
            opacity: this.state.logoFadeAnim,
            alignSelf: "center",
            aspectRatio: ASPECT_RATIO,
            height: undefined,
            resizeMode: "contain",
            width: "75%",
          }}
          source={{ uri: "fluathome_whitelogo" }}
        />
        <Animated.View
          style={[
            styles.children,
            {
              height: screenHeight / 2 - NAV_BAR_HEIGHT - STATUS_BAR_HEIGHT,
              opacity: this.state.textFadeAnim,
            },
          ]}
        >
          {children}
        </Animated.View>
      </View>
    );
  }
}

export default connect()(AnimatedChrome);

const styles = StyleSheet.create({
  container: {
    backgroundColor: "white",
    flex: 1,
    paddingBottom: SYSTEM_PADDING_BOTTOM,
  },
  children: {
    position: "absolute",
    width: "100%",
    bottom: 0,
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
});
