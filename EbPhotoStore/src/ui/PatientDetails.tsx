import React from "react";
import { StyleSheet, Text, View } from "react-native";
import { connect } from "react-redux";
import {
  addPatient,
  setActiveScreenName,
  updatePatient,
  logout,
  Action,
  Screen,
  StoreState
} from "../store";
import Button from "./components/Button";
import TextInput from "./components/TextInput";
import { GUTTER } from "./styles";

interface Props {
  id?: number;
  name?: string;
  nextId?: number;
  notes?: string;
  dispatch(action: Action): void;
}

class PatientDetails extends React.Component<Props> {
  state = {
    name: this.props.name,
    notes: this.props.notes
  };

  _changeName = (name: string) => {
    this.setState({ name });
  };

  _changeNotes = (notes: string) => {
    this.setState({ notes });
  };

  _save = () => {
    if (this.props.id != null) {
      this.props.dispatch(
        updatePatient(this.props.id, this.state.name!, this.state.notes)
      );
    } else {
      this.props.dispatch(addPatient(this.state.name!, this.state.notes));
    }
    this._back();
  };

  _back = () => {
    this.props.dispatch(setActiveScreenName(Screen.Patients));
  };

  render() {
    return (
      <View style={styles.container}>
        <Text>
          Patient {this.props.id != null ? this.props.id : this.props.nextId}
        </Text>
        <TextInput
          placeholder="Patient Name"
          returnKeyType="next"
          style={styles.input}
          value={this.state.name}
          onChangeText={this._changeName}
        />
        <TextInput
          placeholder="Patient Notes"
          returnKeyType="done"
          style={styles.input}
          value={this.state.notes}
          onChangeText={this._changeNotes}
        />
        <Button
          enabled={!!this.state.name}
          label="Save"
          primary={true}
          style={styles.button}
          onPress={this._save}
        />
        <Button
          enabled={true}
          label="Cancel"
          primary={false}
          style={styles.button}
          onPress={this._back}
        />
      </View>
    );
  }
}

const styles = StyleSheet.create({
  button: {
    margin: GUTTER
  },
  container: {
    alignItems: "center",
    flex: 1,
    justifyContent: "center",
    margin: GUTTER
  },
  input: {
    margin: GUTTER,
    padding: GUTTER
  }
});

export default connect((state: StoreState, props: Props) => ({
  name: props.id != null ? state.patients[props.id].name : undefined,
  notes: props.id != null ? state.patients[props.id].notes : undefined,
  nextId: state.patients.length
}))(PatientDetails);
