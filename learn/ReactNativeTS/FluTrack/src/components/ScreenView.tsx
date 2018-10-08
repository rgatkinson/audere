import React from "react";
import { ImageBackground, View, ScrollView } from "react-native";
var styles = require("../Styles.ts");

export default class ScreenView extends React.Component {
  render() {
    return (
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.screenView}
      >
        {this.props.children}
      </ScrollView>
    );
  }
}
