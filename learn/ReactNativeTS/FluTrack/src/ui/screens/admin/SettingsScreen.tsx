import React from "react";
import { NavigationScreenProp } from "react-navigation";
import OpenMoreButton from "./components/OpenMoreButton";
import Description from "../experiment/components/Description";
import { View, StyleSheet } from "react-native";
import ScreenContainer from "../experiment/components/ScreenContainer";

interface Props {
  navigation: NavigationScreenProp<any, any>;
  screenProps: any;
}

export default class SettingsScreen extends React.Component<Props> {
  static navigationOptions = {
    title: "Admin Settings",
  };
  _onPrior = () => {
    this.props.navigation.push("Prior");
  };
  _onPost = () => {
    this.props.navigation.push("Post");
  };
  render() {
    return (
      <ScreenContainer>
        <View style={styles.descriptionContainer}>
          <Description content="These settings should be set by study administrators and staff only." />
        </View>
        <OpenMoreButton label="Prior to Collection" onPress={this._onPrior} />
        <OpenMoreButton label="Post Collection" onPress={this._onPost} />
      </ScreenContainer>
    );
  }
}

const styles = StyleSheet.create({
  descriptionContainer: {
    marginHorizontal: 15,
    marginTop: 25,
    marginBottom: 40,
  },
});
