// Copyright (c) 2019 by Audere
//
// Use of this source code is governed by an MIT-style license that
// can be found in the LICENSE file distributed with this file.
import React from "react";
import {
  KeyboardAvoidingView,
  ScrollView,
  StyleSheet,
  View,
  TouchableOpacity,
  Image,
} from "react-native";
import { connect } from "react-redux";
import { WithNamespaces, withNamespaces } from "react-i18next";
import { PatientInfo } from "audere-lib/ebPhotoStoreProtocol";
import {
  Action,
  StoreState,
  viewPatients,
  addPatient,
  updatePatient,
  Screen,
  LocalPhotoInfo,
} from "../store";
import NumberInput from "./components/NumberInput";
import Text from "./components/Text";
import TextInput from "./components/TextInput";
import Divider from "./components/Divider";
import {
  EBOLA_NEGATIVE_COLOR,
  EBOLA_POSITIVE_COLOR,
  GUTTER,
  FONT_COLOR_LIGHT,
  LARGE_TEXT,
  ICON_SIZE,
  REGULAR_TEXT,
  LIGHT_COLOR,
  THICK_BORDER_WIDTH,
} from "./styles";
import LabelTextInput from "./components/LabelTextInput";
import LabelNumberInput from "./components/LabelNumberInput";
import Button from "./components/Button";
import RadioInput from "./components/RadioInput";
import firebase from "react-native-firebase";
import { TitlebarCallback } from "./AppController";
import i18n from "../i18n";

interface Props {
  editModeEnabled?: boolean;
  toggleable?: boolean;
  id: number;
  isNew: boolean;
  patientInfo: PatientInfo;

  notes?: string;
  dispatch(action: Action): void;
  setupTitlebarInfo?(s: Screen, info: TitlebarCallback): void;
  toggleEditMode(): void;
}

interface State {
  age: string;
  editModeEnabled: boolean;
  firstName: string;
  gender: string;
  lastName: string;
  phone: string;
  details?: string;
  notes?: string;
  chatMessage?: string;
  apiKey?: string;
  location?: string;
}

class Details extends React.Component<Props & WithNamespaces, State> {
  _ageInput: any;
  _lastNameInput: any;
  _phoneInput: any;
  _detailsInput: any;
  _notesInput: any;
  _scrollView: any;

  constructor(props: Props & WithNamespaces) {
    super(props);

    const {
      age,
      firstName,
      gender,
      lastName,
      phone,
      details,
    } = this.props.patientInfo;

    if (!!this.props.setupTitlebarInfo) {
      this.props.setupTitlebarInfo(Screen.AddPatient, {
        onBack: this._navToList,
        getTitlebarText: this._getTitlebarText,
      });
    }

    this.state = {
      age: age || "",
      editModeEnabled: this.props.editModeEnabled || false,
      firstName: firstName || "",
      gender: gender || "",
      lastName: lastName || "",
      phone: phone || "",
      details: details || "",
      notes: this.props.notes || "",
    };

    this._ageInput = React.createRef<NumberInput>();
    this._lastNameInput = React.createRef<TextInput>();
    this._phoneInput = React.createRef<NumberInput>();
    this._detailsInput = React.createRef<TextInput>();
    this._notesInput = React.createRef<TextInput>();
    this._scrollView = React.createRef<ScrollView>();

    this.getGoogleCloudApiKey();
  }

  async getGoogleCloudApiKey() {
    const response = await firebase
      .functions()
      .httpsCallable("googleCloudApiKey")(undefined);
    this.setState({ apiKey: response.data });
  }

  _navToList = () => {
    this.props.dispatch(viewPatients());
  };

  _save = () => {
    const {
      age,
      firstName,
      gender,
      lastName,
      phone,
      details,
      notes,
    } = this.state;
    if (this.props.isNew) {
      if (!!firstName || !!lastName || !!phone || !!details || !!notes) {
        this.props.dispatch(
          addPatient(
            {
              age,
              firstName,
              gender,
              lastName,
              phone,
              details,
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
            age: age.length > 0 ? age : this.props.patientInfo.age,
            firstName:
              firstName.length > 0
                ? firstName
                : this.props.patientInfo.firstName,
            gender: gender.length > 0 ? gender : this.props.patientInfo.gender,
            lastName:
              lastName.length > 0 ? lastName : this.props.patientInfo.lastName,
            phone: phone.length > 0 ? phone : this.props.patientInfo.phone,
            details:
              details && details.length > 0
                ? details
                : this.props.patientInfo.details,
          },
          notes && notes.length > 0 ? notes : this.props.notes
        )
      );
    }
  };

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

  _updateGender = (gender: string) => {
    this.setState({ gender });
  };

  _updateAge = (age: string) => {
    this.setState({ age });
  };

  _toggleEditMode = () => {
    this.setState({ editModeEnabled: !this.state.editModeEnabled });
  };

  _getTitlebarText = () => {
    const { isNew, t } = this.props;
    if (isNew) {
      return t("details:titlebarText");
    } else {
      const { firstName, lastName } = this.props.patientInfo;
      return firstName.length > 0 ? firstName + " " + lastName : lastName;
    }
  };

  _renderEditable = () => {
    const { t, id, toggleable } = this.props;
    const {
      firstName,
      lastName,
      phone,
      details,
      notes,
      age,
      gender,
    } = this.state;

    return (
      <ScrollView
        keyboardShouldPersistTaps={"handled"}
        ref={this._scrollView}
        contentContainerStyle={styles.content}
      >
        <View style={styles.rowSpace}>
          <Text bold={true} content={t("details")} />
          {!!toggleable && (
            <TouchableOpacity onPress={this._toggleEditMode}>
              <Image style={styles.icon} source={{ uri: "edit" }} />
            </TouchableOpacity>
          )}
        </View>

        <View
          style={{
            alignSelf: "flex-end",
            flexDirection: "row",
            marginBottom: -GUTTER - REGULAR_TEXT - GUTTER / 4,
          }}
        >
          <Text bold={true} content={t("patientId")} />
          <Text content={id.toString()} />
        </View>
        <LabelTextInput
          autoCapitalize="words"
          autoFocus={firstName == ""}
          inputValue={firstName}
          onChangeText={this._updateFirstName}
          onSubmitEditing={this._focusLastName}
          placeholder=""
          returnKeyType="next"
          textContent={t("patientFirstName")}
          textStyle={styles.titleRow}
        />
        <LabelTextInput
          autoCapitalize="words"
          ref={this._lastNameInput}
          inputValue={lastName}
          onChangeText={this._updateLastName}
          onSubmitEditing={this._focusPhone}
          placeholder=""
          returnKeyType="next"
          textContent={t("patientLastName")}
          textStyle={styles.titleRow}
        />
        <LabelNumberInput
          inputStyle={[{ marginBottom: GUTTER }, styles.age]}
          inputValue={age}
          ref={this._ageInput}
          keyboardType={"phone-pad"}
          onChangeText={this._updateAge}
          onSubmitEditing={this._focusPhone}
          placeholder=""
          returnKeyType="next"
          textContent={t("patientAge")}
          textStyle={styles.titleRow}
        />
        <RadioInput
          selected={gender}
          namespace={"patientDetails"}
          onSelect={this._updateGender}
          options={["male", "female", "indeterminate"]}
          textContent={t("patientGender")}
          textStyle={styles.titleRow}
        />
        <LabelNumberInput
          inputStyle={{ marginBottom: GUTTER }}
          inputValue={phone}
          ref={this._phoneInput}
          keyboardType={"phone-pad"}
          onChangeText={this._updatePhone}
          onSubmitEditing={this._focusDetails}
          placeholder=""
          returnKeyType="next"
          textContent={t("patientMobileNumber")}
          textStyle={styles.titleRow}
        />
        <LabelTextInput
          blurOnSubmit={true}
          inputValue={details}
          ref={this._detailsInput}
          multiline={true}
          numberOfLines={3}
          onChangeText={this._updateDetails}
          onSubmitEditing={this._focusNotes}
          placeholder={t("patientDetailsPlaceholder")}
          returnKeyType="done"
          textContent={t("patientDetails")}
          textStyle={styles.titleRow}
        />
        <LabelTextInput
          blurOnSubmit={true}
          inputValue={notes}
          ref={this._notesInput}
          multiline={true}
          numberOfLines={3}
          onChangeText={this._updateNotes}
          placeholder={t("patientNotesPlaceholder")}
          returnKeyType="done"
          textContent={t("patientNotes")}
          textStyle={styles.titleRow}
        />
        <View style={{ flexDirection: "row", justifyContent: "space-between" }}>
          <Button
            enabled={true}
            label={t("save")}
            primary={true}
            style={styles.saveButton}
            onPress={this._save}
          />
          <Button
            enabled={true}
            label={t("cancel")}
            primary={true}
            style={styles.cancelButton}
            onPress={this._navToList}
          />
        </View>
      </ScrollView>
    );
  };

  render() {
    const { id, t, toggleable } = this.props;
    const {
      age,
      firstName,
      gender,
      lastName,
      phone,
      details,
      notes,
      editModeEnabled,
    } = this.state;

    return (
      <KeyboardAvoidingView style={styles.container} behavior="padding">
        {editModeEnabled ? (
          this._renderEditable()
        ) : (
          <ScrollView style={{ padding: GUTTER, flexDirection: "column" }}>
            <View style={[styles.spaceRow, styles.row]}>
              <Text bold={true} content={`${firstName} ${lastName}`} />
              {!!toggleable && (
                <TouchableOpacity onPress={this._toggleEditMode}>
                  <Image style={styles.icon} source={{ uri: "edit" }} />
                </TouchableOpacity>
              )}
            </View>
            <View style={[styles.spaceRow, styles.row]}>
              <Text bold={true} content={`${gender}, ${age} ${t("years")}`} />
              <Text bold={true} content={t("id", { id })} />
            </View>
            <Divider style={styles.divider} />
            <Text
              // content={!!evdPositive ? t("evdPositive") : t("evdNegative")}
              // style={[
              //   styles.evdCommon,
              //   {
              //     color: !!evdPositive
              //       ? EBOLA_POSITIVE_COLOR
              //       : EBOLA_NEGATIVE_COLOR,
              //   },
              // ]}

              content={t("contactDetails")}
              style={[styles.sectionLabel, styles.row]}
            />
            <Text bold={true} content={phone} style={styles.row} />
            <Text bold={true} content={details || ""} style={styles.row} />
            <Divider style={styles.divider} />
            <Text style={styles.sectionLabel} content={t("notes")} />
            <Text bold={true} content={notes || ""} style={styles.row} />
          </ScrollView>
        )}
      </KeyboardAvoidingView>
    );
  }
}

const styles = StyleSheet.create({
  age: {
    width: "20%",
  },
  content: {
    padding: GUTTER,
  },
  evdCommon: {
    fontSize: LARGE_TEXT,
    fontWeight: "bold",
    lineHeight: undefined,
    marginHorizontal: GUTTER,
    marginTop: GUTTER,
  },
  evdPos: {
    borderColor: EBOLA_POSITIVE_COLOR,
    borderWidth: THICK_BORDER_WIDTH,
  },
  evdNeg: {
    borderColor: EBOLA_NEGATIVE_COLOR,
    borderWidth: THICK_BORDER_WIDTH,
  },
  container: {
    flex: 1,
  },
  divider: {
    marginVertical: GUTTER,
  },
  icon: {
    height: ICON_SIZE,
    width: ICON_SIZE,
  },
  saveButton: {
    marginBottom: 0,
    flex: 1,
    marginRight: GUTTER / 2,
  },
  cancelButton: {
    backgroundColor: LIGHT_COLOR,
    borderColor: LIGHT_COLOR,
    marginBottom: 0,
    flex: 1,
    marginLeft: GUTTER / 2,
  },
  photoDetails: {
    marginLeft: GUTTER,
    marginRight: -GUTTER,
    flex: 1,
  },
  sectionLabel: {
    color: FONT_COLOR_LIGHT,
    fontSize: LARGE_TEXT,
  },
  spaceRow: {
    flexDirection: "row", // TODO: Fix the naming
    justifyContent: "space-between",
  },
  rowSpace: {
    flexDirection: "row", // TODO: Fix the naming
    justifyContent: "space-between",
    paddingVertical: GUTTER / 2,
  },
  titleRow: {
    fontWeight: "bold",
    paddingTop: GUTTER,
    paddingBottom: GUTTER / 4,
  },
  row: {
    paddingTop: GUTTER / 2,
    paddingBottom: GUTTER / 4,
  },
});

export default connect((state: StoreState, props: Props) => ({
  isNew: props.id === state.patients.length,
  notes:
    state.patients && props.id < state.patients.length
      ? state.patients[props.id].notes
      : undefined,
  patientInfo:
    props.id < state.patients.length
      ? state.patients[props.id].patientInfo
      : {
          firstName: "",
          lastName: "",
          phone: "",
          details: "",
          notes: "",
        },
  photoInfo:
    props.id < state.patients.length
      ? state.patients[props.id].photoInfo.length > 0
        ? state.patients[props.id].photoInfo[
            state.patients[props.id].photoInfo.length - 1
          ]
        : undefined
      : undefined,
}))(withNamespaces("patientDetails")(Details));
