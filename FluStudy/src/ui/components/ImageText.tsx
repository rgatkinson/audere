import React from "react";
import {
  Dimensions,
  Image,
  ImageSourcePropType,
  StyleSheet,
  View,
} from "react-native";
import Text from "./Text";
import { GUTTER } from "../styles";

interface Props {
  imageSrc: ImageSourcePropType;
  imageWidth: number;
  text: string;
}

export default class ImageText extends React.Component<Props> {
  render() {
    return (
      <View style={styles.container}>
        <Image
          style={{
            height: this.props.imageWidth,
            width: this.props.imageWidth,
          }}
          source={this.props.imageSrc}
        />
        <Text
          content={this.props.text}
          style={{
            flex: 1,
            paddingLeft: GUTTER,
          }}
        />
      </View>
    );
  }
}

const styles = StyleSheet.create({
  container: {
    alignItems: "center",
    alignSelf: "stretch",
    flexDirection: "row",
    marginBottom: GUTTER,
  },
});
