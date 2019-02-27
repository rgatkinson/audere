import React from "react";
import {
  Dimensions,
  Image,
  ImageBackground,
  ImageSourcePropType,
  ScrollView,
  StatusBar,
  StyleSheet,
  View,
} from "react-native";
import { WithNamespaces, withNamespaces } from "react-i18next";
import { NavigationScreenProp } from "react-navigation";
import { connect } from "react-redux";
import { Action, StoreState } from "../../store";
import BorderView from "./BorderView";
import Button from "./Button";
import Logo from "./Logo";
import NavigationBar from "./NavigationBar";
import Step from "./Step";
import Text from "./Text";
import Title from "./Title";
import { GUTTER, STATUS_BAR_HEIGHT, SYSTEM_PADDING_BOTTOM } from "../styles";

interface Props {
  buttonLabel?: string;
  canProceed: boolean;
  centerDesc?: boolean;
  children?: any;
  desc?: string;
  footer?: any;
  hideBackButton?: boolean;
  imageAspectRatio?: number;
  imageSrc?: ImageSourcePropType;
  isDemo?: boolean;
  logo?: boolean;
  menuItem?: boolean;
  navigation: NavigationScreenProp<any, any>;
  skipButton?: boolean;
  stableImageSrc?: ImageSourcePropType;
  step?: number;
  title: string;
  onTitlePress?: () => any;
  onNext(): void;
}

@connect((state: StoreState) => ({
  isDemo: state.meta.isDemo,
}))
class Screen extends React.Component<Props & WithNamespaces> {
  _getImage(source: ImageSourcePropType) {
    return (
      <Image
        style={[
          !!this.props.imageAspectRatio
            ? {
                width: "100%",
                height: undefined,
                aspectRatio: this.props.imageAspectRatio,
              }
            : { height: 150, width: 200 },
          { alignSelf: "center", marginVertical: GUTTER / 2 },
        ]}
        source={source}
      />
    );
  }

  render() {
    const { t } = this.props;
    return (
      <View style={styles.container}>
        <ImageBackground
          source={require("../../img/backgroundCrop.png")}
          style={[
            { alignSelf: "stretch" },
            !!this.props.stableImageSrc && { aspectRatio: 1.05, width: "100%" },
          ]}
        >
          <StatusBar barStyle="light-content" backgroundColor="transparent" />
          <NavigationBar
            hideBackButton={this.props.hideBackButton}
            menuItem={this.props.menuItem}
            navigation={this.props.navigation}
          />
          {this.props.isDemo && (
            <Text
              bold={true}
              center={true}
              content="Demo Mode"
              style={styles.demoText}
            />
          )}
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
              {this.props.logo && <Logo />}
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
                  style={{ marginBottom: GUTTER, marginTop: GUTTER / 2 }}
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
                      : t("common:button:next")
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
    opacity: 0.75,
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
