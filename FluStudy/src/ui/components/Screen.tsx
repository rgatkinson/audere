import React from "react";
import {
  Dimensions,
  Image,
  ImageSourcePropType,
  ScrollView,
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
  imageBorder?: boolean;
  imageAspectRatio?: number;
  imageSrc?: ImageSourcePropType;
  isDemo?: boolean;
  logo?: boolean;
  navigation: NavigationScreenProp<any, any>;
  skipButton?: boolean;
  step?: number;
  title: string;
  onTitlePress?: () => any;
  onBack?: () => void;
  onNext(): void;
}

@connect((state: StoreState) => ({
  isDemo: state.meta.isDemo,
}))
class Screen extends React.Component<Props & WithNamespaces> {
  _getImage() {
    if (!!this.props.imageSrc) {
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
            !this.props.imageBorder && { marginVertical: GUTTER / 2 },
          ]}
          source={this.props.imageSrc}
        />
      );
    }
    return null;
  }

  _getBorderImage() {
    if (!!this.props.imageBorder) {
      return (
        <BorderView style={{ marginTop: GUTTER }}>
          {this._getImage()}
        </BorderView>
      );
    }
    return this._getImage();
  }

  render() {
    const { t } = this.props;
    return (
      <View style={styles.container}>
        <NavigationBar
          canProceed={this.props.canProceed}
          hideBackButton={this.props.hideBackButton}
          navigation={this.props.navigation}
          onBack={this.props.onBack}
        />
        {this.props.isDemo &&
          !this.props.logo && (
            <Text
              bold={true}
              center={true}
              content="Demo Mode"
              style={styles.demoText}
            />
          )}
        <View style={styles.scrollContainer}>
          <ScrollView
            contentContainerStyle={{
              flexGrow: 1,
              justifyContent: "space-between",
            }}
          >
            {this.props.logo && <Logo />}
            <View style={styles.innerContainer}>
              {!!this.props.step && (
                <Step step={this.props.step} totalSteps={4} />
              )}
              {this._getBorderImage()}
              <Title
                label={this.props.title}
                onPress={this.props.onTitlePress}
              />
              {!!this.props.desc && (
                <Text
                  content={this.props.desc}
                  center={!!this.props.centerDesc}
                  style={{ marginBottom: GUTTER }}
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
