import React from "react";
import { View } from "react-native";
import Button from "./Button";
import { REGULAR_TEXT } from "../styles";
import Grid from "./Grid";

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
      <Grid
        columns={2}
        items={[
          <Button
            enabled={true}
            fontSize={REGULAR_TEXT}
            label={this.props.firstLabel}
            primary={true}
            style={{ width: undefined, alignSelf: "stretch" }}
            onPress={this.props.firstOnPress}
          />,
          <Button
            enabled={this.props.secondEnabled}
            fontSize={REGULAR_TEXT}
            label={this.props.secondLabel}
            primary={true}
            style={{ width: undefined, alignSelf: "stretch" }}
            onPress={this.props.secondOnPress}
          />,
        ]}
        keyExtractor={(button, i) => "button" + i}
        renderItem={(item, width) => item}
      />
    );
  }
}
