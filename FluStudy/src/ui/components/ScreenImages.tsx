import React from "react";
import { Image, StyleSheet, View } from "react-native";

const ScreenImages = (props: any) => {
  return (
    <View style={styles.imagesContainer}>
      {props.images!.map((uri: string, index: number) => {
        return (
          <Image
            resizeMode={"contain"}
            style={{ flex: 1, height: undefined, width: undefined }}
            key={`${uri}-${index}`}
            source={{ uri: "img/" + uri }}
          />
        );
      })}
    </View>
  );
};

export default ScreenImages;

const styles = StyleSheet.create({
  imagesContainer: {
    flex: 1,
  },
});
