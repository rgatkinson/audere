// Copyright (c) 2019 by Audere
//
// Use of this source code is governed by an MIT-style license that
// can be found in the LICENSE file distributed with this file.

import React from "react";
import {
  Animated,
  Image,
  StatusBar,
  StyleSheet,
  View,
  Dimensions,
} from "react-native";
import { NavigationScreenProp } from "react-navigation";
import NavigationBar from "./NavigationBar";
import {
  ASPECT_RATIO,
  isTablet,
  IMAGE_WIDTH_SQUARE,
  SYSTEM_PADDING_BOTTOM,
  NAV_BAR_HEIGHT,
  STATUS_BAR_HEIGHT,
  BG_IMAGE,
  SPLASH_RATIO,
  BG_RATIO,
  GUTTER,
  PRIMARY_COLOR,
} from "../styles";
import { Action } from "../../store";
import { connect } from "react-redux";

interface Props {
  children?: any;
  dispatch(action: Action): void;
  dispatchOnFirstLoad?: [() => Action];
  hasBeenOpened?: boolean;
  hideBackButton?: boolean;
  menuItem?: boolean;
  navigation: NavigationScreenProp<any, any>;
  splashImage?: string;
  showBackgroundOnly?: boolean;
}

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
    const { dispatchOnFirstLoad, hasBeenOpened, splashImage } = this.props;
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
            duration: !!splashImage ? 500 : 0,
            useNativeDriver: true,
          }),
          Animated.timing(textFadeAnim, {
            toValue: 1,
            duration: 700,
            useNativeDriver: true,
          }),
        ]),
      ]).start(() => {
        !!dispatchOnFirstLoad &&
          dispatchOnFirstLoad.forEach((actionGenerator: () => Action) => {
            this.props.dispatch(actionGenerator());
          });
      });
    }
  }

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
    const bgHeight = screenWidth / BG_RATIO;
    const chromeBgHeight = screenWidth / SPLASH_RATIO;

    return (
      <View style={styles.container}>
        <Animated.View
          style={[
            styles.animatedContainer,
            {
              width: screenWidth,
              aspectRatio: BG_RATIO,
              transform: [
                {
                  translateY: this.state.splashMoveAnim.interpolate({
                    inputRange: [0, 1],
                    outputRange: [0, -bgHeight + chromeBgHeight],
                  }),
                },
              ],
            },
          ]}
        >
          <Image
            source={BG_IMAGE}
            style={[styles.bgImage, { width: screenWidth }]}
          />
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
                top: NAV_BAR_HEIGHT + STATUS_BAR_HEIGHT,
              },
            ]}
            source={{ uri: splashImage }}
          />
        )}
        <Animated.Image
          style={[
            styles.whiteLogo,
            {
              top: screenHeight / 4,
              opacity: this.state.logoFadeAnim,
              transform: [
                {
                  translateY: this.state.splashMoveAnim.interpolate({
                    inputRange: [0, 1],
                    outputRange: [0, -bgHeight + chromeBgHeight],
                  }),
                },
              ],
            },
          ]}
          source={{ uri: "fluathome_whitelogo" }}
        />
        <Animated.View
          style={[
            styles.alignBottom,
            {
              height:
                screenHeight -
                (!!splashImage
                  ? chromeBgHeight
                  : NAV_BAR_HEIGHT + STATUS_BAR_HEIGHT) -
                (isTablet ? NAV_BAR_HEIGHT : 0),
              width: "100%",
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
  alignBottom: {
    position: "absolute",
    bottom: 0,
  },
  animatedContainer: {
    position: "absolute",
    top: 0,
    height: undefined,
  },
  bgImage: {
    height: undefined,
    aspectRatio: BG_RATIO,
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
    position: "absolute",
    width: IMAGE_WIDTH_SQUARE,
  },
  whiteLogo: {
    alignSelf: "center",
    aspectRatio: ASPECT_RATIO,
    height: undefined,
    resizeMode: "contain",
    width: "75%",
  },
});
