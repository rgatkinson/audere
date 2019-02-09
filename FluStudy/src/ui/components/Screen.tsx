import React from "react";
import {
  Dimensions,
  Image,
  ImageSourcePropType,
  StyleSheet,
  View,
} from "react-native";
import { WithNamespaces, withNamespaces } from "react-i18next";
import { NavigationScreenProp } from "react-navigation";
import Button from "./Button";
import NavigationBar from "./NavigationBar";
import Step from "./Step";
import Text from "./Text";
import Title from "./Title";

interface Props {
  alignTop?: boolean;
  buttonLabel?: string;
  canProceed: boolean;
  centerDesc?: boolean;
  children?: any;
  desc?: string;
  footer?: any;
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
  render() {
    const { t } = this.props;
    return (
      <View style={styles.container}>
        {this.props.navBar && (
          <NavigationBar
            canProceed={this.props.canProceed}
            navigation={this.props.navigation}
            onNext={this.props.onNext}
          />
        )}
        {this.props.logo && (
          <Image
            style={{ height: 120, width: Dimensions.get("window").width }}
            source={require("../../img/logo.png")}
          />
        )}
        <View style={styles.innerContainer}>
          {!this.props.alignTop && <View />}
          <View style={styles.contentContainer}>
            {!!this.props.step && (
              <Step step={this.props.step} totalSteps={4} />
            )}
            {!!this.props.imageSrc && (
              <Image
                style={{ height: 150, width: 200 }}
                source={this.props.imageSrc}
              />
            )}
            <Title label={this.props.title} />
            {!!this.props.desc && (
              <Text
                content={this.props.desc}
                center={!!this.props.centerDesc}
              />
            )}
            {this.props.children}
          </View>
          <View style={styles.footerContainer}>
            {!this.props.skipButton && (
              <Button
                enabled={this.props.canProceed}
                primary={true}
                label={
                  this.props.buttonLabel != null
                    ? this.props.buttonLabel
                    : t("common:button:next")
                }
                onPress={this.props.onNext}
              />
            )}
            {this.props.footer}
          </View>
        </View>
      </View>
    );
  }
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: "white",
    flex: 1,
  },
  contentContainer: {
    alignItems: "center",
  },
  footerContainer: {
    alignItems: "center",
    alignSelf: "stretch",
  },
  innerContainer: {
    alignItems: "center",
    flex: 1,
    justifyContent: "space-between",
    margin: 15,
  },
});

export default withNamespaces()<Props>(Screen);
