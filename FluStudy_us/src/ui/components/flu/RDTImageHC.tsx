import React from "react";
import { Dimensions, Image, StyleSheet, View } from "react-native";
import { connect } from "react-redux";
import { StoreState } from "../../../store";
import { GUTTER } from "../../styles";
import BorderView from "../BorderView";

interface Props {
  hcUri: string;
}

class RDTImageHC extends React.PureComponent<Props> {
  render() {
    const { hcUri } = this.props;
    return (
      <View style={styles.container}>
        <BorderView style={styles.border}>
          <Image style={styles.rdt} source={{ uri: hcUri }} />
        </BorderView>
      </View>
    );
  }
}

const width = Dimensions.get("window").width / 5;
const height = Dimensions.get("window").height / 5;

const styles = StyleSheet.create({
  container: {
    alignItems: "center",
    flex: 1,
    justifyContent: "center",
    marginTop: GUTTER * 1.5,
  },
  border: {
    paddingVertical: GUTTER * 3,
  },
  rdt: {
    height: width,
    resizeMode: "contain",
    transform: [{ rotate: "90deg" }],
    width: height,
  },
});

export default connect((state: StoreState) => ({
  hcUri: state.survey.rdtPhotoHCUri,
}))(RDTImageHC);
