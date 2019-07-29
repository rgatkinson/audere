import React, { Fragment } from "react";
import {
  Dimensions,
  Image,
  KeyboardAvoidingView,
  PermissionsAndroid,
  ScrollView,
  StyleSheet,
  View
} from "react-native";
import { connect } from "react-redux";
import { WithNamespaces, withNamespaces } from "react-i18next";
import { HealthWorkerInfo, PatientInfo } from "audere-lib/ebPhotoStoreProtocol";
import {
  addPatient,
  openCamera,
  updatePatient,
  logout,
  viewLocationPermission,
  viewPatients,
  Action,
  PatientEncounter,
  LocalPhotoInfo,
  Screen,
  StoreState
} from "../store";
import Button from "./components/Button";
import NumberInput from "./components/NumberInput";
import Text from "./components/Text";
import TextInput from "./components/TextInput";
import {
  GUTTER,
  NAV_BAR_HEIGHT,
  LARGE_TEXT,
  LINE_HEIGHT_DIFFERENCE
} from "./styles";

interface Props {
  evdPositive?: boolean;
  healthWorkerInfo: HealthWorkerInfo;
  id: number;
  isNew: boolean;
  patientInfo: PatientInfo;
  notes?: string;
  photoInfo?: LocalPhotoInfo;
  setupBackInfo(s: Screen, onBack: () => void): void;
  dispatch(action: Action): void;
}

interface State {
  firstName: string;
  lastName: string;
  phone: string;
  details?: string;
  notes?: string;
}

class Details extends React.Component<Props & WithNamespaces, State> {
  _lastNameInput: any;
  _phoneInput: any;
  _detailsInput: any;
  _notesInput: any;

  constructor(props: Props & WithNamespaces) {
    super(props);
    this.props.setupBackInfo(Screen.PatientDetails, this._back);
    this.state = {
      firstName: props.patientInfo.firstName,
      lastName: props.patientInfo.lastName,
      phone: props.patientInfo.phone,
      details: props.patientInfo.details,
      notes: props.notes
    };

    this._lastNameInput = React.createRef<TextInput>();
    this._phoneInput = React.createRef<NumberInput>();
    this._detailsInput = React.createRef<TextInput>();
    this._notesInput = React.createRef<TextInput>();
  }

  async componentDidMount() {
    await this.checkLocationPermission();
  }

  async checkLocationPermission() {
    try {
      const granted = await PermissionsAndroid.check(
        PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION
      );
      if (!granted) {
        this.props.dispatch(viewLocationPermission());
      }
    } catch (err) {
      console.warn(err);
    }
  }

  _updateFirstName = (firstName: string) => {
    this.setState({ firstName });
  };

  _focusLastName = () => {
    this._lastNameInput.current!.focus();
  };

  _updateLastName = (lastName: string) => {
    this.setState({ lastName });
  };

  _focusPhone = () => {
    this._phoneInput.current!.focus();
  };

  _updatePhone = (phone: string) => {
    this.setState({ phone });
  };

  _focusDetails = () => {
    this._detailsInput.current!.focus();
  };

  _updateDetails = (details: string) => {
    this.setState({ details });
  };

  _focusNotes = () => {
    this._notesInput.current!.focus();
  };

  _updateNotes = (notes: string) => {
    this.setState({ notes });
  };

  _takePhoto = () => {
    this._save();
    this.props.dispatch(openCamera());
  };

  _save = () => {
    const { firstName, lastName, phone, details, notes } = this.state;
    if (this.props.isNew) {
      if (!!firstName || !!lastName || !!phone || !!details || !!notes) {
        this.props.dispatch(
          addPatient(
            {
              firstName,
              lastName,
              phone,
              details
            },
            notes
          )
        );
      }
    } else {
      this.props.dispatch(
        updatePatient(
          this.props.id,
          {
            firstName,
            lastName,
            phone,
            details
          },
          notes
        )
      );
    }
  };

  _back = () => {
    this._save();
    this.props.dispatch(viewPatients());
  };

  render() {
    const {
      evdPositive,
      healthWorkerInfo,
      id,
      patientInfo,
      photoInfo,
      t
    } = this.props;
    const { firstName, lastName, phone, details, notes } = this.state;
    return (
      <KeyboardAvoidingView style={styles.container} behavior="padding">
        {!!evdPositive && (
          <Text content={t("evdPositive")} style={styles.evdPos} />
        )}
        <ScrollView contentContainerStyle={styles.content}>
          <View style={styles.titleRow}>
            <Text content={t("patientId", { id })} style={styles.id} />
          </View>
          <Text content={t("patientFirstName")} />
          <TextInput
            placeholder={t("firstName")}
            returnKeyType="next"
            style={styles.input}
            value={firstName}
            onChangeText={this._updateFirstName}
            onSubmitEditing={this._focusLastName}
          />
          <Text content={t("patientLastName")} />
          <TextInput
            placeholder={t("lastName")}
            ref={this._lastNameInput}
            returnKeyType="next"
            style={styles.input}
            value={lastName}
            onChangeText={this._updateLastName}
            onSubmitEditing={this._focusPhone}
          />
          <Text content={t("patientMobile")} />
          <NumberInput
            placeholder=""
            ref={this._phoneInput}
            returnKeyType="next"
            style={styles.input}
            value={phone}
            onChangeText={this._updatePhone}
            onSubmitEditing={this._focusDetails}
          />
          <Text content={t("patientDetails")} />
          <TextInput
            placeholder=""
            multiline={true}
            numberOfLines={2}
            ref={this._detailsInput}
            returnKeyType="done"
            style={styles.input}
            value={details}
            onChangeText={this._updateDetails}
            onSubmitEditing={this._focusNotes}
          />
          <Text content={t("patientNotes")} />
          <TextInput
            placeholder=""
            multiline={true}
            numberOfLines={2}
            ref={this._notesInput}
            returnKeyType="done"
            style={styles.input}
            value={notes}
            onChangeText={this._updateNotes}
          />
          {photoInfo ? (
            <Fragment>
              <View style={styles.grid}>
                <Image
                  style={[styles.photo, styles.gridItem]}
                  source={{ uri: photoInfo.localPath }}
                />
                <View style={[styles.photoDetails, styles.gridItem]}>
                  <Text content={t("details")} />
                  <Text
                    content={t("date", { ts: photoInfo.photoInfo.timestamp })}
                  />
                  <Text
                    content={t("location", {
                      lat: photoInfo.photoInfo.gps.latitude,
                      long: photoInfo.photoInfo.gps.longitude
                    })}
                  />
                </View>
              </View>
              <TouchableOpacity onPress={this._takePhoto}>
                <Text content={t("retakePhoto")} style={styles.link} />
              </TouchableOpacity>
              <Text
                content={t("recordedBy", {
                  firstName: healthWorkerInfo!.firstName,
                  lastName: healthWorkerInfo!.lastName
                })}
              />
              <Text content={t("followUp")} />
              <Text content={t("startChat", { firstName, lastName })} />
              <TextInput
                multiline={true}
                numberOfLines={2}
                placeholder={t("chatPlaceholder")}
                returnKeyType="done"
                style={styles.input}
              />
            </Fragment>
          ) : (
            <Fragment>
              <View style={styles.grid}>
                <Button
                  enabled={true}
                  label={t("addPhoto")}
                  primary={true}
                  style={[styles.button, styles.gridItem]}
                  onPress={this._takePhoto}
                />
                <Text content={t("photoNote")} style={styles.gridItem} />
              </View>
              <Text
                content={t("recordedBy", {
                  firstName: healthWorkerInfo!.firstName,
                  lastName: healthWorkerInfo!.lastName
                })}
              />
              <Text content={t("note", { phone: healthWorkerInfo!.phone })} />
            </Fragment>
          )}
        </ScrollView>
      </KeyboardAvoidingView>
    );
  }
}

const width = Dimensions.get("window").width / 3;
const height = Dimensions.get("window").height / 3;

const styles = StyleSheet.create({
  button: {
    marginRight: GUTTER
  },
  container: {
    flex: 1
  },
  content: {
    padding: GUTTER
  },
  evdPos: {
    backgroundColor: "pink",
    fontWeight: "bold",
    height: NAV_BAR_HEIGHT,
    textAlign: "center",
    textAlignVertical: "center"
  },
  grid: {
    marginVertical: GUTTER,
    flexDirection: "row"
  },
  gridItem: {
    flex: 1
  },
  id: {
    fontSize: LARGE_TEXT,
    lineHeight: LARGE_TEXT + LINE_HEIGHT_DIFFERENCE,
    marginTop: GUTTER / 2,
    marginBottom: GUTTER
  },
  input: {
    marginVertical: GUTTER,
    paddingVertical: GUTTER
  },
  link: {
    color: "blue",
    padding: GUTTER,
    textDecorationLine: "underline"
  },
  photo: {
    height,
    width
  },
  photoDetails: {
    padding: GUTTER
  },
  titleRow: {
    alignSelf: "stretch",
    flexDirection: "row",
    justifyContent: "space-between"
  }
});

export default connect((state: StoreState, props: Props) => ({
  healthWorkerInfo: state.meta.healthWorkerInfo,
  evdPositive:
    props.id < state.patients.length
      ? state.patients[props.id].evdPositive
      : undefined,
  isNew: props.id === state.patients.length,
  notes:
    props.id < state.patients.length
      ? state.patients[props.id].notes
      : undefined,

  patientInfo:
    props.id < state.patients.length
      ? state.patients[props.id].patientInfo
      : {
          firstName: "",
          lastName: "",
          phone: ""
        },
  photoInfo:
    props.id < state.patients.length
      ? state.patients[props.id].photoInfo.length > 0
        ? state.patients[props.id].photoInfo[
            state.patients[props.id].photoInfo.length - 1
          ]
        : undefined
      : undefined
}))(withNamespaces("details")(Details));
