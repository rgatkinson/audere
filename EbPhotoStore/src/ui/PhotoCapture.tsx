// Copyright (c) 2019 by Audere
//
// Use of this source code is governed by an MIT-style license that
// can be found in the LICENSE file distributed with this file.

import React from "react";
import {
  ActivityIndicator,
  Alert,
  Dimensions,
  StyleSheet,
  TouchableOpacity,
  View
} from "react-native";
import { connect } from "react-redux";
import { RNCamera } from "react-native-camera";
import { savePhoto, viewDetails, Action, Screen, StoreState } from "../store";
import { GUTTER, REGULAR_TEXT, SCREEN_MARGIN } from "./styles";

interface Props {
  id: number;
  dispatch(action: Action): void;
}

class PhotoCapture extends React.Component<Props> {
  camera = React.createRef<any>();

  state = {
    spinner: true
  };

  _cameraReady = () => {
    this.setState({ spinner: false });
  };

  _cameraError = () => {
    // TODO: handle
  };

  _takePicture = async () => {
    const { dispatch } = this.props;
    if (!this.state.spinner) {
      this.setState({ spinner: true });

      try {
        const photoData = await this.camera.current!.takePictureAsync({
          quality: 0.8,
          base64: true,
          orientation: "portrait",
          fixOrientation: true
        });
        this.setState({ spinner: false });
        this.props.dispatch(
          savePhoto(this.props.id, {
            photoId: photoData.base64
          })
        );
        this.props.dispatch(viewDetails(this.props.id));

        // TODO: Michael to save photo.
        // NOTE: Temporarily storing the base64 string in redux. Once a PhotoStore api is available,
        // will switch to storing a PhotoID.
        // NOTE: Ideally remove base64 option from above because it is slow. Should generate
        // asynchronously within PhotoStore from the uri
        // TODO generate a guid here to store in redux for the patient. The PhotoStore
        // should initially return the photo uri for displaying to the user, but once available
        // provide the base64 encoding.
        // API:
        // PhotoStore.savePhoto(guid, photoUri); // Put mapping from guid to photo in photo store,
        //                                          which should generate base64 encoding and upload
        //                                          photo to server
        // PhotoStore.getPhoto(guid);            // Returns either the photoUri or the base64 encoding
        //                                          for use on details page
      } catch (e) {
        Alert.alert(
          "",
          "There was an error capturing the photo, please try again",
          [{ text: "OK", onPress: () => {} }]
        );
        this.setState({ spinner: false });
      }
    }
  };

  render() {
    return (
      <View style={styles.container}>
        <RNCamera
          ref={this.camera}
          style={styles.camera}
          captureAudio={false}
          onCameraReady={this._cameraReady}
          onMountError={this._cameraError}
        />
        <TouchableOpacity
          style={styles.outerCircle}
          onPress={this._takePicture}
        >
          <View style={styles.circle} />
        </TouchableOpacity>
      </View>
    );
  }
}
export default connect()(PhotoCapture);

const styles = StyleSheet.create({
  container: {
    backgroundColor: "black",
    flex: 1,
    marginHorizontal: -SCREEN_MARGIN
  },
  camera: {
    alignSelf: "stretch",
    flex: 1
  },
  outerCircle: {
    alignItems: "center",
    justifyContent: "center",
    borderColor: "white",
    borderWidth: 7,
    borderRadius: 40,
    height: 80,
    width: 80,
    position: "absolute",
    left: (Dimensions.get("window").width - 80) / 2,
    bottom: GUTTER / 2
  },
  circle: {
    backgroundColor: "white",
    borderRadius: 30,
    borderWidth: 3,
    height: 60,
    width: 60
  }
});
