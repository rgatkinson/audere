import React from "react";
import { ScrollView, KeyboardAvoidingView, StyleSheet } from "react-native";

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
const styles = StyleSheet.create({
  scrollView: {
    flex: 1,
    paddingTop: 20,
    paddingHorizontal: 5,
  },
  screenView: {
    alignItems: "center",
    justifyContent: "center",
  },
});
