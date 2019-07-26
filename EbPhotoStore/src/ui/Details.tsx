import React from "react";
import {
  Dimensions,
  Image,
  KeyboardAvoidingView,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  View
} from "react-native";
import { connect } from "react-redux";
import {
  addPatient,
  openCamera,
  updatePatient,
  logout,
  viewPatients,
  Action,
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
  firstName?: string;
  lastName?: string;
  phone?: string;
  details?: string;
  notes?: string;
  photoId?: string;
  dispatch(action: Action): void;
}

class Details extends React.Component<Props> {
  state = {
    firstName: this.props.firstName,
    lastName: this.props.lastName,
    phone: this.props.phone,
    details: this.props.details,
    notes: this.props.notes
  };

  _lastNameInput: any;
  _phoneInput: any;
  _detailsInput: any;
  _notesInput: any;

  constructor(props: Props) {
    super(props);
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

  _takePhoto = () => {
    this._save();
    this.props.dispatch(openCamera());
  };

  _save = () => {
    if (this.props.isNew) {
      if (this.state.firstName || this.state.lastName) {
        this.props.dispatch(
          addPatient(
            this.state.firstName,
            this.state.lastName,
            this.state.phone,
            this.state.details,
            this.state.notes
          )
        );
      }
    } else {
      this.props.dispatch(
        updatePatient(
          this.props.id,
          this.state.firstName,
          this.state.lastName,
          this.state.phone,
          this.state.details,
          this.state.notes
        )
      );
    }
  };

  _back = () => {
    this._save();
    this.props.dispatch(viewPatients());
  };

  render() {
    console.log(this.props.photoId);
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
            value={this.state.firstName}
            onChangeText={this._updateFirstName}
            onSubmitEditing={this._focusLastName}
          />
          <Text content="Patient last name" />
          <TextInput
            placeholder="Patient last name"
            ref={this._lastNameInput}
            returnKeyType="next"
            style={styles.input}
            value={this.state.lastName}
            onChangeText={this._updateLastName}
            onSubmitEditing={this._focusPhone}
          />
          <Text content="Patient mobile number" />
          <NumberInput
            placeholder=""
            ref={this._phoneInput}
            returnKeyType="next"
            style={styles.input}
            value={this.state.phone}
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
            value={this.state.details}
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
            value={this.state.notes}
            onChangeText={this._updateNotes}
          />
          {this.props.photoId && (
            <Image
              style={styles.photo}
              source={{ uri: `data:image/gif;base64,${this.props.photoId}` }}
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
  firstName:
    props.id < state.patients.length
      ? state.patients[props.id].firstName
      : undefined,
  lastName:
    props.id < state.patients.length
      ? state.patients[props.id].lastName
      : undefined,
  phone:
    props.id < state.patients.length
      ? state.patients[props.id].phone
      : undefined,
  details:
    props.id < state.patients.length
      ? state.patients[props.id].details
      : undefined,
  notes:
    props.id < state.patients.length
      ? state.patients[props.id].notes
      : undefined,
  photoId:
    props.id < state.patients.length
      ? state.patients[props.id].photoId
      : undefined
}))(Details);
