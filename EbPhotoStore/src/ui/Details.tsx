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
import firebase from "react-native-firebase";
import {
  AuthUser,
  HealthWorkerInfo,
  PatientInfo,
  Message
} from "audere-lib/ebPhotoStoreProtocol";
import {
  addPatient,
  openCamera,
  updatePatient,
  sendChatMessage,
  viewCameraPermission,
  viewLocationPermission,
  viewPatients,
  Action,
  LocalPhotoInfo,
  Screen,
  StoreState
} from "../store";
import Chat from "./components/Chat";
import NumberInput from "./components/NumberInput";
import Text from "./components/Text";
import TextInput from "./components/TextInput";
import Title from "./components/Title";
import {
  EXTRA_SMALL_TEXT,
  EVD_NEGATIVE_COLOR,
  EVD_POSITIVE_COLOR,
  GUTTER,
  HIGHLIGHT_COLOR,
  LARGE_TEXT,
  TAKE_PHOTO_LARGE_IMAGE,
  TAKE_PHOTO_SMALL_IMAGE,
  TEXT_COLOR,
  THICK_BORDER_WIDTH,
  TITLEBAR_COLOR
} from "./styles";
import { BackCallback } from "./AppController";
import LabelTextInput from "./components/LabelTextInput";
import LabelNumberInput from "./components/LabelNumberInput";

interface Props {
  diagnosisInfo?:
    | {
        diagnoser: AuthUser;
        timestamp: string;
      }
    | undefined;
  evdPositive?: boolean;
  healthWorkerInfo: HealthWorkerInfo;
  id: number;
  isNew: boolean;
  patientInfo: PatientInfo;
  notes?: string;
  photoInfo?: LocalPhotoInfo;
  messages?: Message[];
  setupBackInfo(s: Screen, info: BackCallback): void;
  dispatch(action: Action): void;
}

interface State {
  firstName: string;
  lastName: string;
  focusedIndex?: number;
  phone: string;
  details?: string;
  notes?: string;
  chatMessage?: string;
}

class Details extends React.Component<Props & WithNamespaces, State> {
  _lastNameInput: any;
  _phoneInput: any;
  _detailsInput: any;
  _notesInput: any;
  _wasNew: boolean = false; /* Used to temporarily cache isNew state during transition
                              to the "Take photo" page. Otherwise when the details are
                              saved, isNew goes false and the screen re-renders,
                              flipping the photo section to the "Needs photo capture!"
                              variant. */

  constructor(props: Props & WithNamespaces) {
    super(props);
    this.props.setupBackInfo(Screen.PatientDetails, {
      onBack: this._back,
      backText: "list"
    });
    this.state = {
      firstName: props.patientInfo.firstName,
      lastName: props.patientInfo.lastName,
      focusedIndex: 0,
      phone: props.patientInfo.phone,
      details: props.patientInfo.details,
      notes: props.notes
    };

    this._lastNameInput = React.createRef<TextInput>();
    this._phoneInput = React.createRef<NumberInput>();
    this._detailsInput = React.createRef<TextInput>();
    this._notesInput = React.createRef<TextInput>();
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

  _updateChatMessage = (chatMessage: string) => {
    this.setState({ chatMessage });
  };

  _sendChatMessage = () => {
    if (!this.state.chatMessage) {
      return;
    }
    const message: Message = {
      timestamp: new Date().toISOString(),
      sender: {
        uid: firebase.auth().currentUser!.uid,
        name:
          this.props.healthWorkerInfo.firstName +
          " " +
          this.props.healthWorkerInfo.lastName
      },
      content: this.state.chatMessage
    };
    this.props.dispatch(sendChatMessage(this.props.id, message));
    this.setState({ chatMessage: undefined });
  };

  _takePhoto = async () => {
    this._wasNew = this.props.isNew;
    this._save();
    const { t, dispatch } = this.props;
    try {
      const locationPermission = await PermissionsAndroid.request(
        PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION,
        {
          title: t("locationPermissions:alertTitle"),
          message: t("locationPermissions:alertMsg"),
          buttonNegative: t("common:cancel"),
          buttonPositive: t("common:ok")
        }
      );
      if (locationPermission === PermissionsAndroid.RESULTS.GRANTED) {
        const cameraPermission = await PermissionsAndroid.request(
          PermissionsAndroid.PERMISSIONS.CAMERA,
          {
            title: t("cameraPermissions:alertTitle"),
            message: t("cameraPermissions:alertMsg"),
            buttonNegative: t("common:cancel"),
            buttonPositive: t("common:ok")
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

  _onInputFocus = (focusedIndex: number) => {
    this.setState({ focusedIndex });
  };

  _removeHighlight = () => {
    this.setState({ focusedIndex: undefined });
  };

  render() {
    const {
      evdPositive,
      diagnosisInfo,
      messages,
      healthWorkerInfo,
      id,
      isNew,
      photoInfo,
      t
    } = this.props;
    const {
      firstName,
      focusedIndex,
      lastName,
      phone,
      details,
      notes,
      chatMessage
    } = this.state;
    const isValidForPhoto = !!firstName || !!lastName;

    return (
      <KeyboardAvoidingView style={styles.container} behavior="padding">
        {evdPositive !== undefined && (
          <View
            style={[
              !!evdPositive && styles.evdPos,
              !evdPositive && styles.evdNeg
            ]}
          >
            <Text
              content={!!evdPositive ? t("evdPositive") : t("evdNegative")}
              style={[
                styles.evdCommon,
                {
                  color: !!evdPositive ? EVD_POSITIVE_COLOR : EVD_NEGATIVE_COLOR
                }
              ]}
            />
            {diagnosisInfo !== undefined && (
              <Text
                content={t("reviewedBy", {
                  name: diagnosisInfo.diagnoser.name,
                  date: t("common:date", {
                    date: new Date(diagnosisInfo.timestamp)
                  })
                })}
                style={styles.diagnosisInfo}
                italic={true}
              />
            )}
          </View>
        )}
        <ScrollView contentContainerStyle={styles.content}>
          <View style={styles.idContainer}>
            <Title label={t("details")} style={styles.titleLeft} />
            <Text content={t("patientId", { id })} style={styles.idRight} />
          </View>
          <LabelTextInput
            autoFocus={this.state.firstName == ""}
            focusedIndex={focusedIndex}
            index={0}
            inputStyle={styles.inputSingle}
            inputValue={firstName}
            onBlur={this._removeHighlight}
            onChangeText={this._updateFirstName}
            onFocus={this._onInputFocus}
            onSubmitEditing={this._focusLastName}
            placeholder=""
            returnKeyType="next"
            textContent={t("patientFirstName")}
            textStyle={styles.titleRow}
          />
          <LabelTextInput
            focusedIndex={focusedIndex}
            index={1}
            innerRef={this._lastNameInput}
            inputStyle={styles.inputSingle}
            inputValue={lastName}
            onBlur={this._removeHighlight}
            onChangeText={this._updateLastName}
            onFocus={this._onInputFocus}
            onSubmitEditing={this._focusPhone}
            placeholder=""
            returnKeyType="next"
            textContent={t("patientLastName")}
            textStyle={styles.titleRow}
          />
          <LabelNumberInput
            focusedIndex={focusedIndex}
            index={2}
            inputStyle={[styles.inputSingle, { marginBottom: GUTTER }]}
            inputValue={phone}
            innerRef={this._phoneInput}
            keyboardType={"phone-pad"}
            onBlur={this._removeHighlight}
            onChangeText={this._updatePhone}
            onFocus={this._onInputFocus}
            onSubmitEditing={this._focusDetails}
            placeholder=""
            returnKeyType="next"
            textContent={t("patientMobileNumber")}
            textStyle={styles.titleRow}
          />
          <LabelTextInput
            blurOnSubmit={true}
            focusedIndex={focusedIndex}
            index={3}
            inputStyle={styles.inputMulti}
            inputValue={details}
            innerRef={this._detailsInput}
            multiline={true}
            numberOfLines={3}
            onBlur={this._removeHighlight}
            onChangeText={this._updateDetails}
            onFocus={this._onInputFocus}
            onSubmitEditing={this._focusNotes}
            placeholder={t("patientDetailsPlaceholder")}
            returnKeyType="done"
            textContent={t("patientDetails")}
          />
          <LabelTextInput
            blurOnSubmit={true}
            focusedIndex={focusedIndex}
            index={4}
            inputStyle={styles.inputMulti}
            inputValue={notes}
            innerRef={this._notesInput}
            multiline={true}
            numberOfLines={3}
            onBlur={this._removeHighlight}
            onFocus={this._onInputFocus}
            onChangeText={this._updateNotes}
            onSubmitEditing={this._removeHighlight}
            placeholder={t("patientNotesPlaceholder")}
            returnKeyType="done"
            textContent={t("patientNotes")}
          />
          {photoInfo ? (
            <Fragment>
              <View style={styles.photoContainer}>
                <Text
                  content={t("patientTestStripImage")}
                  style={styles.titleRow}
                />
                <View style={styles.grid}>
                  <Image
                    style={styles.photo}
                    source={{ uri: photoInfo.localPath }}
                  />
                  <View style={styles.photoDetails}>
                    <Text
                      content={
                        t("capturedOn") +
                        t("common:dateTime", {
                          date: new Date(photoInfo.photoInfo.timestamp)
                        }) +
                        "\n"
                      }
                    />
                    <Text
                      content={t("location", {
                        lat: photoInfo.photoInfo.gps.latitude,
                        long: photoInfo.photoInfo.gps.longitude
                      })}
                    />
                    <View style={{ flex: 1, justifyContent: "flex-end" }}>
                      <TouchableOpacity
                        onPress={this._takePhoto}
                        style={styles.takePhotoContainer}
                      >
                        <Image
                          source={TAKE_PHOTO_SMALL_IMAGE}
                          style={styles.takePhotoSmall}
                        />
                        <Text
                          content={t("retakePhoto").toUpperCase()}
                          style={styles.takePhotoText}
                        />
                      </TouchableOpacity>
                    </View>
                  </View>
                </View>
                {evdPositive === undefined ? (
                  <Text content={t("followUp")} />
                ) : null}
              </View>
              <LabelTextInput
                blurOnSubmit={true}
                focusedIndex={focusedIndex}
                index={5}
                inputStyle={styles.inputMulti}
                inputValue={chatMessage}
                multiline={true}
                numberOfLines={2}
                onBlur={this._removeHighlight}
                onChangeText={this._updateChatMessage}
                onFocus={this._onInputFocus}
                onSubmitEditing={this._sendChatMessage}
                placeholder={t("chatPlaceholder")}
                returnKeyType="done"
                textContent={t("startChat", { firstName, lastName })}
                textStyle={styles.titleRow}
              />
              {!!messages && <Chat messages={messages} />}
            </Fragment>
          ) : !(isNew || this._wasNew) ? (
            <Fragment>
              <View style={styles.photoContainer}>
                <Text
                  content={t("patientTestStripImage")}
                  style={styles.titleRow}
                />
                <View style={styles.grid}>
                  <TouchableOpacity onPress={this._takePhoto}>
                    <View style={[styles.photo, styles.emptyPhoto]}>
                      <Image
                        style={styles.takePhotoLarge}
                        source={TAKE_PHOTO_LARGE_IMAGE}
                      />
                    </View>
                  </TouchableOpacity>
                  <View style={styles.photoDetails}>
                    <Text
                      content={t("noPhotoCaptured")}
                      style={{ marginBottom: GUTTER / 2 }}
                    />
                    <TouchableOpacity
                      onPress={this._takePhoto}
                      style={styles.takePhotoContainer}
                    >
                      <Image
                        source={TAKE_PHOTO_SMALL_IMAGE}
                        style={styles.takePhotoSmall}
                      />
                      <Text
                        content={t("addPhoto").toUpperCase()}
                        style={styles.takePhotoText}
                      />
                    </TouchableOpacity>
                  </View>
                </View>
                <Text content={t("note", { phone: healthWorkerInfo!.phone })} />
              </View>
            </Fragment>
          ) : (
            <Fragment>
              <View style={styles.photoContainer}>
                <Text
                  content={t("patientTestStripImage")}
                  style={styles.titleRow}
                />
                <Text content={t("photoNote")} />
                <TouchableOpacity
                  disabled={!isValidForPhoto}
                  onPress={this._takePhoto}
                  style={[
                    styles.takePhotoContainer,
                    !isValidForPhoto && { opacity: 0.5 }
                  ]}
                >
                  <Image
                    source={TAKE_PHOTO_LARGE_IMAGE}
                    style={[styles.takePhotoLarge, { marginRight: GUTTER / 2 }]}
                  />
                  <Text
                    content={t("addPhoto").toUpperCase()}
                    style={styles.takePhotoText}
                  />
                </TouchableOpacity>
                <Text content={t("note", { phone: healthWorkerInfo!.phone })} />
              </View>
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
  evdCommon: {
    fontSize: LARGE_TEXT,
    fontWeight: "bold",
    lineHeight: undefined,
    marginHorizontal: GUTTER,
    marginTop: GUTTER
  },
  evdPos: {
    borderColor: EVD_POSITIVE_COLOR,
    borderWidth: THICK_BORDER_WIDTH
  },
  evdNeg: {
    borderColor: EVD_NEGATIVE_COLOR,
    borderWidth: THICK_BORDER_WIDTH
  },
  diagnosisInfo: {
    fontSize: EXTRA_SMALL_TEXT,
    marginHorizontal: GUTTER,
    marginBottom: GUTTER
  },
  idContainer: {
    flexDirection: "row",
    alignItems: "flex-end"
  },
  titleLeft: {
    flex: 2,
    marginBottom: 0
  },
  idRight: {
    flex: 1,
    textAlign: "right",
    marginBottom: 1
  },
  titleRow: {
    paddingTop: GUTTER,
    paddingBottom: GUTTER / 4
  },
  inputSingle: {
    padding: 0
  },
  inputMulti: {
    borderWidth: 1,
    marginBottom: GUTTER
  },
  photoContainer: {
    backgroundColor: TITLEBAR_COLOR,
    marginHorizontal: -GUTTER,
    paddingHorizontal: GUTTER,
    marginTop: GUTTER,
    paddingBottom: GUTTER
  },
  grid: {
    marginVertical: 0,
    marginRight: GUTTER,
    flexDirection: "row"
  },
  photo: {
    height,
    width
  },
  emptyPhoto: {
    borderWidth: 1,
    borderColor: TEXT_COLOR,
    backgroundColor: "white",
    flex: 1,
    alignItems: "center",
    justifyContent: "center"
  },
  photoDetails: {
    paddingHorizontal: GUTTER
  },
  takePhotoContainer: {
    flexDirection: "row",
    alignItems: "center"
  },
  takePhotoLarge: {
    height: 49,
    width: 49,
    marginVertical: GUTTER / 2
  },
  takePhotoSmall: {
    height: 33,
    width: 33,
    marginRight: GUTTER / 2
  },
  takePhotoText: {
    color: HIGHLIGHT_COLOR
  }
});

export default connect((state: StoreState, props: Props) => ({
  healthWorkerInfo: state.meta.healthWorkerInfo,
  diagnosisInfo:
    props.id < state.patients.length
      ? state.patients[props.id].diagnosisInfo
      : undefined,
  // TODO(ram): derive evdPositive from diagnoses collection instead of evdPositive
  evdPositive:
    props.id < state.patients.length
      ? state.patients[props.id].evdPositive
      : undefined,
  // TODO(ram): derive messages from messages collection
  messages:
    props.id < state.patients.length
      ? state.patients[props.id].messages || []
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
