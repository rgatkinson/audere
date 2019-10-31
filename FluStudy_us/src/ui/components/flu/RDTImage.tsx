import React from "react";
import { SampleInfo } from "audere-lib/chillsProtocol";
import { Dimensions, Image, Platform, StyleSheet, View } from "react-native";
import { connect } from "react-redux";
import { StoreState } from "../../../store";
import { GUTTER } from "../../styles";

interface Props {
  rdt: boolean;
  testStripImg?: SampleInfo;
  uri: string;
}

class RDTImage extends React.PureComponent<Props> {
  render() {
    const { rdt, testStripImg, uri } = this.props;
    if (uri == null) {
      return null;
    }

    let imageUri = uri;
    if (rdt && Platform.OS === "android" && !!testStripImg) {
      // Append photo id so that we don't pull an old cached version
      // if user re-took the picture
      imageUri = imageUri + "?" + testStripImg.code;
    }

    return (
      <View style={styles.container}>
        <Image
          style={rdt ? styles.rdt : styles.photo}
          source={{ uri: imageUri }}
        />
      </View>
    );
  }
}

const width = Dimensions.get("window").width / 2;
const height = Dimensions.get("window").height / 2;

const styles = StyleSheet.create({
  container: {
    alignItems: "center",
    alignSelf: "center",
    height,
    width,
    marginTop: GUTTER * 1.5,
    marginBottom: GUTTER / 2,
    justifyContent: "center",
  },
  photo: {
    height,
    width,
  },
  rdt: {
    height: width,
    resizeMode: "contain",
    transform: [{ rotate: "90deg" }],
    width: height,
  },
});

export default connect((state: StoreState) => ({
  rdt: !!state.survey.rdtPhotoUri,
  uri: !!state.survey.rdtPhotoUri
    ? state.survey.rdtPhotoUri
    : state.survey.photoUri,
  testStripImg: state.survey.testStripImg,
}))(RDTImage);
