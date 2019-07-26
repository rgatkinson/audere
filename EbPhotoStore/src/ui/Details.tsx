import React from "react";
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
import { PatientInfo, PhotoInfo } from "audere-lib/ebPhotoStoreProtocol";
import {
  addPatient,
  openCamera,
  updatePatient,
  logout,
  viewLocationPermission,
  viewPatients,
  Action,
  PatientEncounter,
  Screen,
  StoreState
} from "../store";
import Button from "./components/Button";
import NumberInput from "./components/NumberInput";
import Text from "./components/Text";
import TextInput from "./components/TextInput";
import Title from "./components/Title";
import { GUTTER, LARGE_TEXT, LINE_HEIGHT_DIFFERENCE } from "./styles";

interface Props {
  id: number;
  isNew: boolean;
  patientInfo: PatientInfo;
  notes?: string;
  photoInfo?: PhotoInfo;
  dispatch(action: Action): void;
}

interface State {
  firstName: string;
  lastName: string;
  phone: string;
  details?: string;
  notes?: string;
}

class Details extends React.Component<Props, State> {
  _lastNameInput: any;
  _phoneInput: any;
  _detailsInput: any;
  _notesInput: any;

  constructor(props: Props) {
    super(props);
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
    const { firstName, lastName, phone, details, notes } = this.state;
    return (
      <KeyboardAvoidingView style={styles.container} behavior="padding">
        <ScrollView style={styles.content}>
          <View style={styles.titleRow}>
            <TouchableOpacity onPress={this._back}>
              <Title label="< Back to Patient List" />
            </TouchableOpacity>
            <Text content={"Patient ID: " + this.props.id} style={styles.id} />
          </View>
          <Text content="Patient first name" />
          <TextInput
            placeholder="Patient first name"
            returnKeyType="next"
            style={styles.input}
            value={firstName}
            onChangeText={this._updateFirstName}
            onSubmitEditing={this._focusLastName}
          />
          <Text content="Patient last name" />
          <TextInput
            placeholder="Patient last name"
            ref={this._lastNameInput}
            returnKeyType="next"
            style={styles.input}
            value={lastName}
            onChangeText={this._updateLastName}
            onSubmitEditing={this._focusPhone}
          />
          <Text content="Patient mobile number" />
          <NumberInput
            placeholder=""
            ref={this._phoneInput}
            returnKeyType="next"
            style={styles.input}
            value={phone}
            onChangeText={this._updatePhone}
            onSubmitEditing={this._focusDetails}
          />
          <Text content="Patient contact details (address, location)" />
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
          <Text content="CHW notes for patient (Shared with government workers)" />
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
          {this.props.photoInfo && (
            <Image
              style={styles.photo}
              source={{
                uri: `data:image/gif;base64,${this.props.photoInfo.photoId}`
              }}
            />
          )}
          <Button
            enabled={true}
            label="Add Photo"
            primary={true}
            style={styles.button}
            onPress={this._takePhoto}
          />
        </ScrollView>
      </KeyboardAvoidingView>
    );
  }
}

const width = Dimensions.get("window").width / 2;
const height = Dimensions.get("window").height / 2;

const styles = StyleSheet.create({
  button: {
    margin: GUTTER
  },
  container: {
    flex: 1
  },
  content: {
    padding: GUTTER
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
  photo: {
    height,
    width
  },
  titleRow: {
    alignSelf: "stretch",
    flexDirection: "row",
    justifyContent: "space-between"
  }
});

export default connect((state: StoreState, props: Props) => ({
  isNew: props.id === state.patients.length,
  patientInfo:
    props.id < state.patients.length
      ? state.patients[props.id].patientInfo
      : {
          firstName: "",
          lastName: "",
          phone: ""
        },
  notes:
    props.id < state.patients.length
      ? state.patients[props.id].notes
      : undefined,
  photoInfo:
    props.id < state.patients.length
      ? state.patients[props.id].photoInfo
      : undefined
}))(Details);
