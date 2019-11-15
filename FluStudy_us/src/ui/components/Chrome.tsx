// Copyright (c) 2019 by Audere
//
// Use of this source code is governed by an MIT-style license that
// can be found in the LICENSE file distributed with this file.

import React from "react";
import {
  BackHandler,
  Dimensions,
  Image,
  ImageBackground,
  StatusBar,
  StyleSheet,
  View,
} from "react-native";
import { NavigationScreenProp } from "react-navigation";
import { Action } from "redux";
import { connect } from "react-redux";
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
  dispatch(action: Action): void;
  hasBeenOpened?: boolean;
  hideBackButton?: boolean;
  menuItem?: boolean;
  navigation: NavigationScreenProp<any, any>;
  onBack?: (
    nav: NavigationScreenProp<any, any>,
    dispatch: (action: Action) => void
  ) => boolean;
  splashImage?: string;
  showBackgroundOnly?: boolean;
}

class Chrome extends React.PureComponent<Props> {
  _willFocus: any;
  _willBlur: any;

  componentDidMount() {
    const { navigation } = this.props;
    this._willFocus = navigation.addListener(
      "willFocus",
      this._handleWillFocus
    );
    this._willBlur = navigation.addListener("willBlur", this._handleWillBlur);

    // We need to manually call this here in case the component is being instantiated
    // on first run of the app, or on StackActions.replace. In other words, if the
    // screen that it's a part of isn't being pushed on to the nav stack.
    this._handleWillFocus();
  }

  componentWillUnmount() {
    this._handleWillBlur();
    this._willFocus.remove();
    this._willBlur.remove();
  }

  _handleWillFocus = () => {
    BackHandler.addEventListener(
      "hardwareBackPress",
      this._handleHardwareBackPress
    );
  };

  _handleWillBlur = () => {
    BackHandler.removeEventListener(
      "hardwareBackPress",
      this._handleHardwareBackPress
    );
  };

  _handleHardwareBackPress = (): boolean => {
    return (
      this.props.navigation.isFocused() &&
      (!!this.props.onBack &&
        !this.props.onBack(this.props.navigation, this.props.dispatch))
    );
  };

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

export default connect()(Chrome);

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
