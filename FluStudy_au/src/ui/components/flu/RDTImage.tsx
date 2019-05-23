import React from "react";
import { Dimensions, Image, StyleSheet, View } from "react-native";
import { connect } from "react-redux";
import { StoreState } from "../../../store";
import { GUTTER } from "../../styles";

interface Props {
  rdt: boolean;
  uri: string;
}

class RDTImage extends React.Component<Props> {
  render() {
    const { rdt, uri } = this.props;
    if (uri == null) {
      return null;
    }

    return (
      <View style={styles.container}>
        <Image style={rdt ? styles.rdt : styles.photo} source={{ uri }} />
      </View>
    );
  }
}

const width = Dimensions.get("window").width / 2;
const height = Dimensions.get("window").height / 2;

const styles = StyleSheet.create({
  container: {
    alignItems: "center",
    flex: 1,
    marginBottom: GUTTER,
    justifyContent: "center",
  },
  photo: {
    height,
    width,
  },
  rdt: {
    height: width,
    resizeMode: "contain",
    transform: [{ rotate: '90deg' }],
    width: height,
  },
});

export default connect((state: StoreState) => ({
  uri: state.survey.rdtPhotoUri,
}))(RDTImage);
