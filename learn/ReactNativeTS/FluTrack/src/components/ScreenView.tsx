import React from "react";
import { ScrollView, KeyboardAvoidingView } from "react-native";
import styles from "../Styles";

export default class ScreenView extends React.Component {
  render() {
    return (
      <KeyboardAvoidingView style={{ flex: 1 }}>
        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.screenView}
        >
          {this.props.children}
        </ScrollView>
      </KeyboardAvoidingView>
    );
  }
}
