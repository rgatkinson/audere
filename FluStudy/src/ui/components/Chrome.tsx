import React from "react";
import {
  Image,
  ImageBackground,
  ImageSourcePropType,
  Platform,
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
  ASPECT_RATIO,
  GUTTER,
  IMAGE_WIDTH,
  SPLASH_IMAGE,
  SPLASH_RATIO,
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
      <Image style={styles.image} source={this.props.stableImageSrc} />
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
          source={SPLASH_IMAGE}
          style={[
            { alignSelf: "stretch" },
            !!this.props.stableImageSrc && {
              aspectRatio: SPLASH_RATIO,
              width: "100%",
            },
          ]}
        >
          <StatusBar barStyle="light-content" backgroundColor="transparent" />
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
