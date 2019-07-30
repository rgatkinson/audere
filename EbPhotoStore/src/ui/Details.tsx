import React, { Fragment } from "react";
import {
  Dimensions,
  Image,
  KeyboardAvoidingView,
  PermissionsAndroid,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  View
} from "react-native";
import { connect } from "react-redux";
import { WithNamespaces, withNamespaces } from "react-i18next";
import { format } from "date-fns";
import {
  HealthWorkerInfo,
  PatientInfo,
  Message
} from "audere-lib/ebPhotoStoreProtocol";
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
import { GUTTER, NAV_BAR_HEIGHT, SMALL_TEXT } from "./styles";

interface Props {
  evdPositive?: boolean;
  healthWorkerInfo: HealthWorkerInfo;
  id: number;
  isNew: boolean;
  patientInfo: PatientInfo;
  notes?: string;
  photoInfo?: LocalPhotoInfo;
  messages?: Message[];
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
      messages,
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
          <View style={styles.idContainer}>
            <Text content={t("patientId", { id })} style={styles.id} />
          </View>
          <Text content={t("patientFirstName")} />
          <TextInput
            placeholder={t("firstName")}
            returnKeyType="next"
            style={styles.inputSingle}
            value={firstName}
            onChangeText={this._updateFirstName}
            onSubmitEditing={this._focusLastName}
          />
          <Text content={t("patientLastName")} style={styles.titleRow} />
          <TextInput
            placeholder={t("lastName")}
            ref={this._lastNameInput}
            returnKeyType="next"
            style={styles.inputSingle}
            value={lastName}
            onChangeText={this._updateLastName}
            onSubmitEditing={this._focusPhone}
          />
          <Text content={t("patientMobileNumber")} style={styles.titleRow} />
          <NumberInput
            placeholder={t("mobileNumber")}
            ref={this._phoneInput}
            returnKeyType="next"
            style={styles.inputSingle}
            value={phone}
            onChangeText={this._updatePhone}
            onSubmitEditing={this._focusDetails}
          />
          <Text content={t("patientDetails")} style={styles.titleRow} />
          <TextInput
            placeholder=""
            multiline={true}
            numberOfLines={3}
            ref={this._detailsInput}
            returnKeyType="done"
            style={styles.inputMulti}
            value={details}
            onChangeText={this._updateDetails}
            onSubmitEditing={this._focusNotes}
          />
          <Text content={t("patientNotes")} style={styles.titleRow} />
          <TextInput
            placeholder=""
            multiline={true}
            numberOfLines={3}
            ref={this._notesInput}
            returnKeyType="done"
            style={styles.inputMulti}
            value={notes}
            onChangeText={this._updateNotes}
          />
          {photoInfo ? (
            <Fragment>
              <View style={styles.grid}>
                <Image
                  style={styles.photo}
                  source={{ uri: photoInfo.localPath }}
                />
                <View style={styles.photoDetails}>
                  <Text content={t("details")} />
                  <Text
                    content={t("date", {
                      ts: format(
                        new Date(photoInfo.photoInfo.timestamp),
                        "DD MMMM YYYY, hh:mm a"
                      )
                    })}
                  />
                  <Text
                    content={t("location", {
                      lat: photoInfo.photoInfo.gps.latitude,
                      long: photoInfo.photoInfo.gps.longitude
                    })}
                  />
                </View>
              </View>
              <View style={[styles.grid, { marginTop: 0 }]}>
                <TouchableOpacity onPress={this._takePhoto}>
                  <Text content={t("retakePhoto")} style={styles.link} />
                </TouchableOpacity>
                <View style={styles.photoDetails} />
              </View>
              <Text
                content={t("recordedBy", {
                  firstName: healthWorkerInfo!.firstName,
                  lastName: healthWorkerInfo!.lastName
                })}
              />
              <Text content={t("followUp")} />
              <Text content={t("startChat", { firstName, lastName })} />
              <Text
                content={
                  messages
                    ? messages
                        .map(
                          message =>
                            `${message.sender.name}: ${message.content}`
                        )
                        .join("\n")
                    : ""
                }
              />
              <TextInput
                multiline={true}
                numberOfLines={2}
                placeholder={t("chatPlaceholder")}
                returnKeyType="done"
                style={styles.inputMulti}
              />
            </Fragment>
          ) : (
            <Fragment>
              <View style={styles.grid}>
                <Button
                  enabled={!!firstName || !!lastName}
                  label={t("addPhoto")}
                  primary={true}
                  style={styles.button}
                  onPress={this._takePhoto}
                />
                <Text content={t("photoNote")} style={{ width: "50%" }} />
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
    marginRight: GUTTER,
    marginBottom: 0,
    width: "50%"
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
  idContainer: {
    flexDirection: "row",
    justifyContent: "flex-end"
  },
  id: {
    fontSize: SMALL_TEXT
  },
  titleRow: {
    paddingTop: GUTTER,
    paddingBottom: GUTTER / 4
  },
  inputSingle: {
    padding: 0
  },
  inputMulti: {
    borderWidth: 1
  },
  grid: {
    marginTop: GUTTER,
    marginBottom: 0,
    marginRight: GUTTER,
    flexDirection: "row"
  },
  link: {
    color: "blue",
    textAlign: "center",
    textDecorationLine: "underline",
    width
  },
  photo: {
    height,
    width
  },
  photoDetails: {
    padding: GUTTER
  }
});

export default connect((state: StoreState, props: Props) => ({
  healthWorkerInfo: state.meta.healthWorkerInfo,
  // TODO(ram): derive evdPositive from diagnoses collection instead of evdPositive
  evdPositive:
    props.id < state.patients.length
      ? state.patients[props.id].evdPositive
      : undefined,
  // TODO(ram): derive messages from messages collection instead of triageNotes
  messages:
    props.id < state.patients.length
      ? [
          {
            content: state.patients[props.id].triageNotes,
            sender: { name: "Government worker" }
          }
        ]
      : [],
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
