import React from "react";
import { ImageBackground, View, ScrollView } from "react-native";
import styles from "../Styles";

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
