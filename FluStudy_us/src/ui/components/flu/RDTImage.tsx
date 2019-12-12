import React from "react";
import { SampleInfo } from "audere-lib/chillsProtocol";
import { Dimensions, Image, Platform, StyleSheet, View } from "react-native";
import { connect } from "react-redux";
import { StoreState } from "../../../store";
import { GUTTER } from "../../styles";

interface Props {
  isDemo: boolean;
  rdt: boolean;
  rdtPhotoHCUri?: string;
  testStripImg?: SampleInfo;
  uri: string;
}

class RDTImage extends React.PureComponent<Props> {
  render() {
    const { isDemo, rdt, rdtPhotoHCUri, testStripImg, uri } = this.props;
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
        {isDemo && !!testStripImg && !!rdtPhotoHCUri && (
          <Image
            style={styles.hcImage}
            source={{ uri: rdtPhotoHCUri + "?" + testStripImg.code }}
          />
        )}
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
    justifyContent: "center",
    marginTop: GUTTER * 2,
    marginBottom: GUTTER,
  },
  hcImage: {
    height: width,
    resizeMode: "contain",
    width: width,
    marginTop: GUTTER * 2,
  },
  photo: {
    height,
    width,
  },
  rdt: {
    height: height,
    resizeMode: "contain",
    transform: [{ rotate: "90deg" }],
    width: height,
  },
});

export default connect((state: StoreState) => ({
  isDemo: state.meta.isDemo,
  rdt: !!state.survey.rdtPhotoUri,
  rdtPhotoHCUri: state.survey.rdtPhotoHCUri,
  uri: !!state.survey.rdtPhotoUri
    ? state.survey.rdtPhotoUri
    : state.survey.photoUri,
  testStripImg: state.survey.testStripImg,
}))(RDTImage);
