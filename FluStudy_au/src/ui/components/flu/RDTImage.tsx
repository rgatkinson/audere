import React from "react";
import { Dimensions, Image } from "react-native";
import { connect } from "react-redux";
import { StoreState } from "../../../store";
import { GUTTER } from "../../styles";

interface Props {
  uri: string;
}

class RDTImage extends React.Component<Props> {
  render() {
    const { uri } = this.props;
    const screenWidth = Dimensions.get("window").width;
    const screenHeight = Dimensions.get("window").height;
    if (uri == null) {
      return null;
    }

    return (
      <Image
        style={{
          alignSelf: "center",
          aspectRatio: screenWidth / screenHeight,
          resizeMode: "contain",
          width: "50%",
          marginVertical: GUTTER,
        }}
        source={{ uri }}
      />
    );
  }
}

export default connect((state: StoreState) => ({
  uri: state.survey.rdtPhotoUri,
}))(RDTImage);
