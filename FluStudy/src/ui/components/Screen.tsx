import React from "react";
import {
  Dimensions,
  Image,
  ImageBackground,
  ImageSourcePropType,
  ScrollView,
  StatusBar,
  StyleSheet,
  TouchableWithoutFeedback,
  View,
} from "react-native";
import { WithNamespaces, withNamespaces } from "react-i18next";
import { NavigationScreenProp } from "react-navigation";
import { connect } from "react-redux";
import { Action, StoreState, setDemo } from "../../store";
import BorderView from "./BorderView";
import Button from "./Button";
import NavigationBar from "./NavigationBar";
import Step from "./Step";
import Text from "./Text";
import Title from "./Title";
import {
  GUTTER,
  NAV_BAR_HEIGHT,
  EXTRA_SMALL_TEXT,
  STATUS_BAR_HEIGHT,
  SYSTEM_PADDING_BOTTOM,
} from "../styles";

interface Props {
  buttonLabel?: string;
  canProceed: boolean;
  centerDesc?: boolean;
  children?: any;
  desc?: string;
  dispatch?(action: Action): void;
  footer?: any;
  hideBackButton?: boolean;
  imageAspectRatio?: number;
  imageSrc?: ImageSourcePropType;
  shortImage?: boolean;
  isDemo?: boolean;
  menuItem?: boolean;
  navigation: NavigationScreenProp<any, any>;
  skipButton?: boolean;
  stableImageSrc?: ImageSourcePropType;
  step?: number;
  title: string;
  onTitlePress?: () => any;
  onNext(): void;
}

const TRIPLE_PRESS_DELAY = 500;

@connect((state: StoreState) => ({
  isDemo: state.meta.isDemo,
}))
class Screen extends React.Component<Props & WithNamespaces> {
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

  _getImage(source: ImageSourcePropType) {
    const image = (
      <Image
        style={[
          !!this.props.imageAspectRatio
            ? {
                width: this.props.shortImage ? "75%" : "100%",
                height: undefined,
                aspectRatio: this.props.imageAspectRatio,
              }
            : { height: 150, width: 200 },
          { alignSelf: "center", marginVertical: GUTTER / 2 },
        ]}
        source={source}
      />
    );
    if (this.props.shortImage) {
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
    const { t } = this.props;
    return (
      <View style={styles.container}>
        <ImageBackground
          source={
            this.props.shortImage
              ? require("../../img/shortBackground.png")
              : require("../../img/backgroundCrop.png")
          }
          style={[
            { alignSelf: "stretch" },
            !!this.props.stableImageSrc && {
              aspectRatio: this.props.shortImage ? 1.61 : 1.05,
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
          />
          {!!this.props.stableImageSrc &&
            this._getImage(this.props.stableImageSrc)}
        </ImageBackground>
        <View style={styles.scrollContainer}>
          <ScrollView
            contentContainerStyle={{
              flexGrow: 1,
              justifyContent: "space-between",
            }}
          >
            <View style={styles.innerContainer}>
              {!!this.props.step && (
                <Step step={this.props.step} totalSteps={4} />
              )}
              {!!this.props.imageSrc && this._getImage(this.props.imageSrc)}
              <Title
                label={this.props.title}
                onPress={this.props.onTitlePress}
              />
              {!!this.props.desc && (
                <Text
                  content={this.props.desc}
                  center={!!this.props.centerDesc}
                  style={{
                    alignSelf: "stretch",
                    paddingBottom: GUTTER,
                    paddingTop: GUTTER / 2,
                  }}
                />
              )}
              {this.props.children}
            </View>
            <View style={styles.footerContainer}>
              {!this.props.skipButton && (
                <Button
                  enabled={this.props.canProceed}
                  label={
                    this.props.buttonLabel != null
                      ? this.props.buttonLabel
                      : t("common:button:continue")
                  }
                  primary={true}
                  onPress={this.props.onNext}
                />
              )}
              {this.props.footer}
            </View>
          </ScrollView>
        </View>
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
  footerContainer: {
    alignItems: "center",
    alignSelf: "stretch",
    marginHorizontal: GUTTER,
  },
  innerContainer: {
    alignItems: "center",
    marginHorizontal: GUTTER,
  },
  scrollContainer: {
    alignSelf: "stretch",
    flex: 1,
  },
});

export default withNamespaces()<Props>(Screen);
