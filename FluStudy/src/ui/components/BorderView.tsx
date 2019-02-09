import React from "react";
import { StyleProp, StyleSheet, View, ViewStyle } from "react-native";

interface Props {
  children?: any;
  style?: StyleProp<ViewStyle>;
}

export default class BorderView extends React.Component<Props> {
  render() {
    return (
      <View style={[styles.container, this.props.style]}>
        {this.props.children}
      </View>
    );
  }
}

const styles = StyleSheet.create({
  container: {
    alignItems: "center",
    alignSelf: "stretch",
    borderColor: "#666",
    borderRadius: 3,
    borderWidth: 1,
    padding: 15,
  },
});
