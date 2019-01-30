import React from "react";
import { StyleSheet, StatusBar } from "react-native";
import { KeyboardAwareScrollView } from "react-native-keyboard-aware-scroll-view";

interface Props {
  children: any;
}

export default class ScreenContainer extends React.Component<Props> {
  render() {
    return (
      <KeyboardAwareScrollView
        resetScrollToCoords={{ x: 0, y: 0 }}
        style={styles.container}
      >
        <StatusBar barStyle="dark-content" />
        {this.props.children}
      </KeyboardAwareScrollView>
    );
  }
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: "white",
  },
});
