import React from "react";
import { View } from "react-native";
import Text from "./Text";

interface Props {
  content: string;
}

export default class BulletPoint extends React.Component<Props> {
  render() {
    return (
      <View style={{ flexDirection: "row" }}>
        <Text content={"\u2022  "} />
        <Text content={this.props.content} />
      </View>
    );
  }
}
