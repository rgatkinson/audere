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
import { wrapScrollView } from "react-native-scroll-into-view";
import { Action } from "../../store";
import Button from "./Button";
import Chrome from "./Chrome";
import Step from "./Step";
import Text from "./Text";
import Title from "./Title";
import { GUTTER } from "../styles";

interface Props {
  buttonLabel?: string;
  canProceed: boolean;
  centerDesc?: boolean;
  children?: any;
  desc?: string;
  dispatch?(action: Action): void;
  footer?: any;
  hideBackButton?: boolean;
  imageSrc?: ImageSourcePropType;
  shortImage?: boolean;
  isDemo?: boolean;
  menuItem?: boolean;
  navigation: NavigationScreenProp<any, any>;
  skipButton?: boolean;
  stableImageSrc?: ImageSourcePropType;
  step?: number;
  title?: string;
  onTitlePress?: () => void;
  onBack?: () => void;
  onNext?: () => void;
}

const CustomScrollView = wrapScrollView(ScrollView);

class Screen extends React.Component<Props & WithNamespaces> {
  render() {
    const { t } = this.props;
    return (
      <Chrome
        dispatch={this.props.dispatch}
        hideBackButton={this.props.hideBackButton}
        shortImage={this.props.shortImage}
        menuItem={this.props.menuItem}
        navigation={this.props.navigation}
        stableImageSrc={this.props.stableImageSrc}
        onBack={this.props.onBack}
      >
        <View style={styles.scrollContainer}>
          <CustomScrollView
            contentContainerStyle={{
              flexGrow: 1,
              justifyContent: "space-between",
            }}
            keyboardShouldPersistTaps="always"
          >
            <View style={styles.innerContainer}>
              {!!this.props.step && (
                <Step step={this.props.step} totalSteps={4} />
              )}
              {!!this.props.imageSrc && (
                <Image style={styles.image} source={this.props.imageSrc} />
              )}
              {!!this.props.title && (
                <Title
                  label={this.props.title}
                  onPress={this.props.onTitlePress}
                />
              )}
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
          </CustomScrollView>
        </View>
      </Chrome>
    );
  }
}

const styles = StyleSheet.create({
  footerContainer: {
    alignItems: "center",
    alignSelf: "stretch",
    marginHorizontal: GUTTER,
  },
  image: {
    alignSelf: "center",
    aspectRatio: 1.75,
    height: undefined,
    marginVertical: GUTTER / 2,
    width: "100%",
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
