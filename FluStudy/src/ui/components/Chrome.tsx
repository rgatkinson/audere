import React from "react";
import {
  Image,
  ImageBackground,
  ImageSourcePropType,
  StatusBar,
  StyleSheet,
  TouchableWithoutFeedback,
  View,
} from "react-native";
import { NavigationScreenProp } from "react-navigation";
import { connect } from "react-redux";
import { Action, StoreState, setDemo } from "../../store";
import NavigationBar from "./NavigationBar";
import Text from "./Text";
import {
  GUTTER,
  IMAGE_WIDTH,
  NAV_BAR_HEIGHT,
  SPLASH_IMAGE,
  SPLASH_RATIO,
  STATUS_BAR_HEIGHT,
  SYSTEM_PADDING_BOTTOM,
} from "../styles";

interface Props {
  children?: any;
  dispatch?(action: Action): void;
  hideBackButton?: boolean;
  isDemo?: boolean;
  menuItem?: boolean;
  navigation: NavigationScreenProp<any, any>;
  stableImageSrc?: ImageSourcePropType;
  onBack?: () => void;
}

const TRIPLE_PRESS_DELAY = 500;

@connect((state: StoreState) => ({
  isDemo: state.meta.isDemo,
}))
export default class Chrome extends React.Component<Props> {
  lastTap: number | null = null;
  secondLastTap: number | null = null;

  handleTripleTap = () => {
    const now = Date.now();
    if (
      this.lastTap != null &&
      this.secondLastTap != null &&
      now - this.secondLastTap! < TRIPLE_PRESS_DELAY
    ) {
      this.props.dispatch!(setDemo(!this.props.isDemo));
    } else {
      this.secondLastTap = this.lastTap;
      this.lastTap = now;
    }
  };

  _getImage() {
    if (this.props.stableImageSrc == null) {
      return null;
    }
    const image = (
      <Image
        style={[styles.image, this.props.menuItem && styles.shortImage]}
        source={this.props.stableImageSrc}
      />
    );
    if (this.props.menuItem) {
      return (
        <TouchableWithoutFeedback
          style={{ alignSelf: "stretch" }}
          onPress={this.handleTripleTap}
        >
          <View>{image}</View>
        </TouchableWithoutFeedback>
      );
    }
    return image;
  }

  render() {
    return (
      <View style={styles.container}>
        <ImageBackground
          source={
            this.props.menuItem
              ? require("../../img/shortSplash.png")
              : SPLASH_IMAGE
          }
          style={[
            { alignSelf: "stretch" },
            !!this.props.stableImageSrc && {
              aspectRatio: this.props.menuItem ? 1.61 : SPLASH_RATIO,
              width: "100%",
            },
          ]}
        >
          <StatusBar barStyle="light-content" backgroundColor="transparent" />
          {this.props.isDemo && (
            <Text
              bold={true}
              center={true}
              content="Demo Mode"
              style={styles.demoText}
            />
          )}
          <NavigationBar
            demoMode={this.props.isDemo}
            hideBackButton={this.props.hideBackButton}
            menuItem={this.props.menuItem}
            navigation={this.props.navigation}
            onBack={this.props.onBack}
          />
          {this._getImage()}
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
  demoText: {
    backgroundColor: "green",
    color: "white",
    opacity: 0.5,
    paddingTop: STATUS_BAR_HEIGHT,
    position: "absolute",
    top: 0,
    left: 0,
    lineHeight: NAV_BAR_HEIGHT,
    right: 0,
    height: NAV_BAR_HEIGHT + STATUS_BAR_HEIGHT,
  },
  image: {
    alignSelf: "center",
    aspectRatio: 1.75,
    height: undefined,
    marginVertical: GUTTER / 2,
    width: IMAGE_WIDTH,
  },
  shortImage: {
    aspectRatio: 4.23,
    width: "75%",
  },
});
