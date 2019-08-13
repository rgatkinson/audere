// Copyright (c) 2019 by Audere
//
// Use of this source code is governed by an MIT-style license that
// can be found in the LICENSE file distributed with this file.

import React from "react";
import {
  ActivityIndicator,
  Alert,
  PermissionsAndroid,
  StyleSheet,
  TouchableOpacity,
  View,
} from "react-native";
import { connect } from "react-redux";
import { WithNamespaces, withNamespaces } from "react-i18next";
import { RNCamera } from "react-native-camera";
import Geolocation from "react-native-geolocation-service";
import RNFS from "react-native-fs";
import uuidv4 from "uuid/v4";
import {
  savePhoto,
  viewDetails,
  viewCameraPermission,
  viewLocationPermission,
  Action,
  Screen,
  StoreState,
} from "../store";
import { startUpload } from "../transport/photoUploader";
import { GUTTER, REGULAR_TEXT, SCREEN_MARGIN } from "./styles";

const LOCAL_DIR_NAME = RNFS.DocumentDirectoryPath + "/photos";

interface Props {
  id: number;
  dispatch(action: Action): void;
}

class PhotoCapture extends React.Component<Props & WithNamespaces> {
  camera = React.createRef<any>();

  async componentDidMount() {
    await this._checkPermissions();
    Geolocation.getCurrentPosition(
      position => {
        this.setState({
          haveLocation: true,
          lat: position.coords.latitude,
          long: position.coords.longitude,
        });
      },
      error => {
        this.setState({ haveLocation: true });
        console.log(error.code, error.message);
      },
      { enableHighAccuracy: true, timeout: 15000, maximumAge: 10000 }
    );
  }

  async _checkPermissions() {
    try {
      const cameraGranted = await PermissionsAndroid.check(
        PermissionsAndroid.PERMISSIONS.CAMERA
      );
      if (!cameraGranted) {
        this.props.dispatch(viewCameraPermission());
        return;
      }
      const locationGranted = await PermissionsAndroid.check(
        PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION
      );
      if (!locationGranted) {
        this.props.dispatch(viewLocationPermission());
      }
    } catch (err) {
      console.warn(err);
    }
  }

  state = {
    spinner: true,
    haveLocation: false,
    lat: 0,
    long: 0,
  };

  _cameraReady = () => {
    this.setState({ spinner: false });
  };

  _cameraError = () => {
    // TODO: handle
  };

  _takePicture = async () => {
    const { t, dispatch } = this.props;
    if (!this.state.spinner) {
      this.setState({ spinner: true });

      try {
        const photoData = await this.camera.current!.takePictureAsync({
          quality: 0.8,
          orientation: "portrait",
          fixOrientation: false,
          skipProcessing: true,
          pauseAfterCapture: true,
          width: 640,
        });

        const photoId = uuidv4();
        const localPath = `file://${LOCAL_DIR_NAME}/${photoId}.jpg`;
        await RNFS.mkdir(LOCAL_DIR_NAME);
        await RNFS.copyFile(photoData.uri, localPath);

        this.setState({ spinner: false });
        startUpload(photoId, localPath, this.props.id);
        this.props.dispatch(
          savePhoto(this.props.id, localPath, {
            photoId,
            timestamp: new Date().toISOString(),
            gps: {
              latitude: this.state.lat.toString(),
              longitude: this.state.long.toString(),
            },
          })
        );
        this.props.dispatch(viewDetails(this.props.id));
      } catch (e) {
        Alert.alert("", t("error"), [
          { text: t("common:ok"), onPress: () => {} },
        ]);
        this.setState({ spinner: false });
        console.warn(e);
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
        <View style={styles.buttonContainer}>
          <TouchableOpacity
            style={styles.outerCircle}
            onPress={this._takePicture}
          >
            <View style={styles.circle} />
          </TouchableOpacity>
        </View>
        <ActivityIndicator
          animating={this.state.spinner || !this.state.haveLocation}
          size="large"
          style={styles.spinner}
        />
      </View>
    );
  }
}
export default connect()(withNamespaces("photoCapture")(PhotoCapture));

const styles = StyleSheet.create({
  buttonContainer: {
    alignItems: "center",
    bottom: GUTTER,
    justifyContent: "center",
    left: 0,
    position: "absolute",
    right: 0,
  },
  container: {
    backgroundColor: "black",
    flex: 1,
    marginHorizontal: -SCREEN_MARGIN,
  },
  camera: {
    alignSelf: "stretch",
    flex: 1,
  },
  circle: {
    backgroundColor: "white",
    borderColor: "transparent",
    borderRadius: 30,
    borderWidth: 3,
    height: 60,
    width: 60,
  },
  outerCircle: {
    alignItems: "center",
    justifyContent: "center",
    borderColor: "white",
    borderWidth: 7,
    borderRadius: 40,
    height: 80,
    width: 80,
  },
  spinner: {
    alignItems: "center",
    backgroundColor: "transparent",
    justifyContent: "center",
    left: 0,
    position: "absolute",
    right: 0,
    top: "50%",
  },
});
