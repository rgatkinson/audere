import React from "react";
import { Image, ImageSourcePropType, StyleSheet, View } from "react-native";
import Text from "./Text";

interface Props {
  imageSrc: ImageSourcePropType;
  text: string;
}

export default class Step extends React.Component<Props> {
  render() {
    return (
      <View style={styles.container}>
        <Image style={styles.image} source={this.props.imageSrc} />
        <Text content={this.props.text} style={styles.text} />
      </View>
    );
  }
}

const styles = StyleSheet.create({
  container: {
    alignItems: "center",
    alignSelf: "stretch",
    flexDirection: "row",
    margin: 10,
  },
  image: {
    height: 60,
    width: 60,
  },
  text: {
    marginLeft: 15,
    width: 250,
  },
});
