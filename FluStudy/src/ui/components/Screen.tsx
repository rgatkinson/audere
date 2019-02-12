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
import BorderView from "./BorderView";
import Button from "./Button";
import NavigationBar from "./NavigationBar";
import Step from "./Step";
import Text from "./Text";
import Title from "./Title";
import { GUTTER, LOGO_HEIGHT, STATUS_BAR_HEIGHT } from "../styles";

interface Props {
  buttonLabel?: string;
  canProceed: boolean;
  centerDesc?: boolean;
  children?: any;
  desc?: string;
  footer?: any;
  imageBorder?: boolean;
  imageSrc?: ImageSourcePropType;
  logo?: boolean;
  navBar: boolean;
  navigation: NavigationScreenProp<any, any>;
  skipButton?: boolean;
  step?: number;
  title: string;
  onNext(): void;
}

class Screen extends React.Component<Props & WithNamespaces> {
  _getImage() {
    if (!!this.props.imageSrc) {
      return (
        <Image
          style={[
            { height: 150, width: 200 },
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
      return <BorderView style={{ marginTop: GUTTER }}>{this._getImage()}</BorderView>;
    }
    return this._getImage();
  }

  render() {
    const { t } = this.props;
    return (
      <View
        style={[
          styles.container,
          !this.props.navBar && { paddingTop: STATUS_BAR_HEIGHT },
        ]}
      >
        {this.props.navBar && (
          <NavigationBar
            canProceed={this.props.canProceed}
            navigation={this.props.navigation}
            onNext={this.props.onNext}
          />
        )}
        <View style={styles.scrollContainer}>
          <ScrollView>
            {this.props.logo && (
              <Image
                style={{
                  height: LOGO_HEIGHT,
                  width: Dimensions.get("window").width,
                }}
                source={require("../../img/logo.png")}
              />
            )}
            <View style={styles.innerContainer}>
              {!!this.props.step && (
                <Step step={this.props.step} totalSteps={4} />
              )}
              {this._getBorderImage()}
              <Title label={this.props.title} />
              {!!this.props.desc && (
                <Text
                  content={this.props.desc}
                  center={!!this.props.centerDesc}
                  style={{ marginBottom: GUTTER }}
                />
              )}
              {this.props.children}
            </View>
          </ScrollView>
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
      </View>
    );
  }
}

const styles = StyleSheet.create({
  container: {
    alignSelf: "stretch",
    backgroundColor: "white",
    flex: 1,
  },
  footerContainer: {
    alignItems: "center",
    alignSelf: "stretch",
    marginHorizontal: GUTTER,
  },
  innerContainer: {
    alignItems: "center",
    flex: 1,
    justifyContent: "space-between",
    marginHorizontal: GUTTER,
  },
  scrollContainer: {
    alignSelf: "stretch",
    flex: 1,
  },
});

export default withNamespaces()<Props>(Screen);
