import React from "react";
import { connect } from "react-redux";
import {
  Dimensions,
  Image,
  ImageSourcePropType,
  ScrollView,
  StyleSheet,
  TouchableWithoutFeedback,
  View,
} from "react-native";
import { WithNamespaces, withNamespaces } from "react-i18next";
import { NavigationScreenProp } from "react-navigation";
import { wrapScrollView } from "react-native-scroll-into-view";
import { Action, setDemo, StoreState } from "../../store";
import Button from "./Button";
import Chrome from "./Chrome";
import Divider from "./Divider";
import Step from "./Step";
import Text from "./Text";
import Title from "./Title";
import VideoPlayer from "./VideoPlayer";
import ScreenImages from "./ScreenImages";
import { ASPECT_RATIO, GUTTER, IMAGE_WIDTH } from "../styles";

interface Props {
  buttonLabel?: string;
  canProceed: boolean;
  centerDesc?: boolean;
  children?: any;
  desc?: string;
  dispatch?(action: Action): void;
  footer?: any;
  hideBackButton?: boolean;
  images?: string[];
  imageSrc?: ImageSourcePropType;
  isDemo?: boolean;
  menuItem?: boolean;
  navigation: NavigationScreenProp<any, any>;
  skipButton?: boolean;
  stableImageSrc?: ImageSourcePropType;
  step?: number;
  subTitle?: string;
  title?: string;
  videoSource?: { uri: string; type: string };
  onTitlePress?: () => void;
  onBack?: () => void;
  onNext?: () => void;
}

const CustomScrollView = wrapScrollView(ScrollView);

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

  render() {
    const { t } = this.props;
    return (
      <Chrome
        dispatch={this.props.dispatch}
        hideBackButton={this.props.hideBackButton}
        isDemo={this.props.isDemo}
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
              paddingHorizontal: GUTTER / 2,
            }}
            keyboardShouldPersistTaps="handled"
          >
            <View style={styles.innerContainer}>
              {!!this.props.step && (
                <Step step={this.props.step} totalSteps={4} />
              )}
              {!!this.props.imageSrc && (
                <TouchableWithoutFeedback
                  style={{ alignSelf: "stretch" }}
                  onPress={this.handleTripleTap}
                >
                  <Image
                    style={[
                      styles.image,
                      this.props.menuItem && styles.menuImage,
                    ]}
                    source={this.props.imageSrc}
                  />
                </TouchableWithoutFeedback>
              )}
              {!!this.props.subTitle && (
                <View style={{ paddingHorizontal: GUTTER * 2 }}>
                  <Divider style={{ marginVertical: GUTTER / 2 }} />
                  <Text
                    style={{ alignSelf: "center" }}
                    content={this.props.subTitle}
                  />
                  <Divider style={{ marginVertical: GUTTER / 2 }} />
                </View>
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
                    marginTop: GUTTER / 2,
                    marginBottom: GUTTER,
                  }}
                />
              )}
              {!!this.props.images && (
                <ScreenImages images={this.props.images} />
              )}
              {this.props.children}
              {this.props.videoSource != null && (
                <VideoPlayer source={this.props.videoSource} />
              )}
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
    aspectRatio: ASPECT_RATIO,
    height: undefined,
    marginVertical: GUTTER / 2,
    width: IMAGE_WIDTH,
  },
  innerContainer: {
    marginHorizontal: GUTTER,
    flex: 1,
  },
  menuImage: {
    aspectRatio: 4.23,
    width: "80%",
  },
  scrollContainer: {
    alignSelf: "stretch",
    flex: 1,
  },
});

export default withNamespaces()(Screen);
