import React from "react";
import {
  Image,
  ImageBackground,
  ImageSourcePropType,
  Platform,
  StatusBar,
  StyleSheet,
  View,
} from "react-native";
import { NavigationScreenProp } from "react-navigation";
import { Action } from "../../store";
import NavigationBar from "./NavigationBar";
import Text from "./Text";
import {
  ASPECT_RATIO,
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

export default class Chrome extends React.Component<Props> {
  render() {
    return (
      <View style={styles.container}>
        <ImageBackground
          source={
            this.props.menuItem
              ? {
                  uri:
                    Platform.OS === "ios"
                      ? "img/shortSplash"
                      : "asset:/short_splash.png",
                }
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
          {!!this.props.stableImageSrc && (
            <Image style={styles.image} source={this.props.stableImageSrc} />
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
