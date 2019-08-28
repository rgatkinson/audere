// Copyright (c) 2019 by Audere
//
// Use of this source code is governed by an MIT-style license that
// can be found in the LICENSE file distributed with this file.
import React, { Component, Fragment } from "react";
import {
  Image,
  StyleSheet,
  TouchableOpacity,
  View,
  PermissionsAndroid,
  Dimensions,
  ScrollView,
} from "react-native";
import { connect } from "react-redux";
import { WithNamespaces, withNamespaces } from "react-i18next";
import Text from "./components/Text";
import { GUTTER, HIGHLIGHT_COLOR, INPUT_HEIGHT } from "./styles";
import {
  StoreState,
  Action,
  LocalPhotoInfo,
  openCamera,
  viewCameraPermission,
  viewLocationPermission,
  AnalysisStatus,
} from "../store";
import { HealthWorkerInfo } from "audere-lib/ebPhotoStoreProtocol";

interface Props {
  analysisStatus?: AnalysisStatus;
  dispatch(action: Action): void;
  evdPositive?: boolean;
  healthWorkerInfo: HealthWorkerInfo;
  id: number;
  isNew: boolean;
  isValidForPhoto: boolean;
  photoInfo?: LocalPhotoInfo;
}

class Tests extends Component<Props & WithNamespaces> {
  constructor(props: Props & WithNamespaces) {
    super(props);
  }

  _takePhoto = async () => {
    const { t, dispatch } = this.props;
    try {
      const locationPermission = await PermissionsAndroid.request(
        PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION,
        {
          title: t("locationPermissions:alertTitle"),
          message: t("locationPermissions:alertMsg"),
          buttonNegative: t("common:cancel"),
          buttonPositive: t("common:ok"),
        }
      );
      if (locationPermission === PermissionsAndroid.RESULTS.GRANTED) {
        const cameraPermission = await PermissionsAndroid.request(
          PermissionsAndroid.PERMISSIONS.CAMERA,
          {
            title: t("cameraPermissions:alertTitle"),
            message: t("cameraPermissions:alertMsg"),
            buttonNegative: t("common:cancel"),
            buttonPositive: t("common:ok"),
          }
        );
        if (cameraPermission === PermissionsAndroid.RESULTS.GRANTED) {
          dispatch(openCamera());
        } else {
          dispatch(viewCameraPermission());
        }
      } else {
        dispatch(viewLocationPermission());
      }
    } catch (err) {
      console.warn(err);
    }
  };

  _processPhoto = () => {
    // TODO (JAY): Finish photo image processing once we have photo processing
    // this.props.dispatch(setTestStripAnalysisInProgress(this.props.id));
  };

  _renderPhotoCaptured = () => {
    const { photoInfo, t, evdPositive } = this.props;
    return (
      <Fragment>
        <Text content={t("photoCaptured")} style={styles.titleRow} />
        <View style={styles.grid}>
          <Image style={styles.photo} source={{ uri: photoInfo!.localPath }} />
          <View>
            <Text
              content={
                t("capturedOn") +
                t("common:dateTime", {
                  date: new Date(photoInfo!.photoInfo.timestamp),
                }) +
                "\n"
              }
            />
            <Text
              content={t("location", {
                lat: photoInfo!.photoInfo.gps.latitude,
                long: photoInfo!.photoInfo.gps.longitude,
              })}
            />
          </View>
        </View>
        <Text
          bold={true}
          content={t("saveOrRetake")}
          style={{ marginVertical: GUTTER }}
        />
        <View
          style={{
            flexDirection: "row",
          }}
        >
          <TouchableOpacity
            onPress={this._processPhoto}
            style={styles.takePhotoContainerLeft}
          >
            <Text
              center={true}
              content={t("accept")}
              style={styles.takePhotoText}
            />
          </TouchableOpacity>
          <TouchableOpacity
            onPress={this._takePhoto}
            style={styles.takePhotoContainerRight}
          >
            <Text
              center={true}
              content={t("retakePhoto").toUpperCase()}
              style={[styles.takePhotoText, styles.reTakePhotoText]}
            />
          </TouchableOpacity>
        </View>
        <Text content={t("note")} />
      </Fragment>
    );
  };

  _renderNoPhoto = () => {
    const { t } = this.props;
    return (
      <Fragment>
        <Text content={t("patientTestStripImage")} style={styles.titleRow} />
        <View style={{ flexDirection: "column" }}>
          <Text
            bold={true}
            content={t("noPhotoCaptured")}
            style={{ marginBottom: GUTTER / 2 }}
          />
          <TouchableOpacity
            onPress={this._takePhoto}
            style={styles.takePhotoContainer}
          >
            <Text
              center={true}
              content={t("addPhoto").toUpperCase()}
              style={[
                styles.takePhotoText,
                { width: "50%", marginVertical: GUTTER },
              ]}
            />
          </TouchableOpacity>
        </View>
        <Text content={t("instructions")} />
      </Fragment>
    );
  };

  render() {
    const { photoInfo } = this.props;

    return (
      <ScrollView
        keyboardShouldPersistTaps={"handled"}
        contentContainerStyle={styles.content}
      >
        {photoInfo ? this._renderPhotoCaptured() : this._renderNoPhoto()}
      </ScrollView>
    );
  }
}

const width = Dimensions.get("window").width / 3;
const height = Dimensions.get("window").height / 3;

const styles = StyleSheet.create({
  content: {
    padding: GUTTER,
  },
  grid: {
    marginVertical: 0,
    marginRight: GUTTER,
    flexDirection: "row",
  },
  photo: {
    height,
    width,
    marginRight: GUTTER,
  },
  reTakePhotoText: {
    color: HIGHLIGHT_COLOR,
    backgroundColor: "white",
  },
  takePhotoContainer: {
    flex: 1,
  },
  takePhotoContainerLeft: {
    flex: 1,
    marginRight: GUTTER / 4,
  },
  takePhotoContainerRight: {
    flex: 1,
    marginLeft: GUTTER / 4,
  },
  takePhotoText: {
    paddingVertical: GUTTER,
    width: "100%",
    height: INPUT_HEIGHT,
    color: "white",
    backgroundColor: HIGHLIGHT_COLOR,
    borderColor: HIGHLIGHT_COLOR,
    borderWidth: 2,
    borderRadius: 10,
  },
  titleRow: {
    paddingTop: GUTTER,
    paddingBottom: GUTTER / 2,
  },
});

export default connect((state: StoreState, props: Props) => ({
  evdPositive: state.patients
    ? props.id < state.patients.length
      ? state.patients[props.id].evdPositive
      : undefined
    : undefined,
  healthWorkerInfo: state.meta.healthWorkerInfo,
  isNew: state.patients ? props.id === state.patients.length : true,
  isValidForPhoto:
    state.patients &&
    ((state.patients[props.id] &&
      !state.patients[props.id].patientInfo.firstName) ||
      (state.patients[props.id] &&
        !state.patients[props.id].patientInfo.lastName)),
  photoInfo: state.patients
    ? props.id < state.patients.length
      ? state.patients[props.id].photoInfo.length > 0
        ? state.patients[props.id].photoInfo[
            state.patients[props.id].photoInfo.length - 1
          ]
        : undefined
      : undefined
    : undefined,
  analysisStatus: state.patients
    ? props.id < state.patients.length
      ? state.patients[props.id].analysisStatus
      : state.patients[props.id].analysisStatus
    : undefined,
}))(withNamespaces("photos")(Tests));
