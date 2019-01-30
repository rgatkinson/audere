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
import Text from "./Text";
import Title from "./Title";

interface Props {
  buttonLabel?: string;
  children?: any;
  imageSrc: ImageSourcePropType;
  navBar: boolean;
  navigation: NavigationScreenProp<any, any>;
  title: string;
  desc?: string;
  onNext(): void;
}

class InfoScreen extends React.Component<Props & WithNamespaces> {
  render() {
    const { t } = this.props;
    return (
      <View style={styles.container}>
        {this.props.navBar && (
          <NavigationBar
            canProceed={true}
            navigation={this.props.navigation}
            onNext={this.props.onNext}
          />
        )}
        <View style={styles.innerContainer}>
          <Image
            style={{ height: 120, width: Dimensions.get("window").width }}
            source={require("../../img/logo.png")}
          />
          <View style={styles.content}>
            <Image
              style={{ height: 150, width: 150 }}
              source={this.props.imageSrc}
            />
            <Title label={this.props.title} />
            {!!this.props.desc && <Text content={this.props.desc} />}
            {this.props.children}
          </View>
          <Button
            enabled={true}
            primary={true}
            label={
              this.props.buttonLabel != null
                ? this.props.buttonLabel
                : t("common:button:next")
            }
            onPress={this.props.onNext}
          />
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
  content: {
    alignItems: "center",
  },
  innerContainer: {
    alignItems: "center",
    flex: 1,
    justifyContent: "space-between",
    marginBottom: 20,
    marginHorizontal: 15,
    marginTop: 20,
  },
});

export default withNamespaces()<Props>(InfoScreen);
