import React from "react";
import { StyleSheet, View } from "react-native";
import Button from "./Button";

interface Props {
  firstLabel: string;
  secondLabel: string;
  secondEnabled: boolean;
  firstOnPress(): void;
  secondOnPress(): void;
}

export default class ButtonRow extends React.Component<Props> {
  render() {
    return (
      <View style={styles.container}>
        <Button
          enabled={true}
          fontSize={17}
          label={this.props.firstLabel}
          primary={true}
          style={styles.button}
          onPress={this.props.firstOnPress}
        />
        <Button
          enabled={this.props.secondEnabled}
          fontSize={17}
          label={this.props.secondLabel}
          primary={true}
          style={styles.button}
          onPress={this.props.secondOnPress}
        />
      </View>
    );
  }
}

const styles = StyleSheet.create({
  button: {
    width: 165,
  },
  container: {
    alignSelf: "stretch",
    flexDirection: "row",
    justifyContent: "space-between",
  },
});
