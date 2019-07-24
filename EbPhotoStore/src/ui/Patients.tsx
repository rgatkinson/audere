import React from "react";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { connect } from "react-redux";
import {
  setActiveScreenName,
  viewPatient,
  logout,
  Action,
  Patient,
  Screen,
  StoreState
} from "../store";
import Button from "./components/Button";
import { GUTTER, INPUT_HEIGHT } from "./styles";

interface Props {
  patients: Patient[];
  dispatch(action: Action): void;
}

class Patients extends React.Component<Props> {
  _addPatient = () => {
    this.props.dispatch(setActiveScreenName(Screen.PatientDetails));
  };

  _viewPatient = (id: number) => {
    this.props.dispatch(viewPatient(id));
  };

  _logout = () => {
    this.props.dispatch(logout());
  };

  render() {
    return (
      <View style={styles.container}>
        <Button
          enabled={true}
          label="Add Patient"
          primary={true}
          style={styles.button}
          onPress={this._addPatient}
        />
        {this.props.patients.map(patient => (
          <PatientRow
            key={patient.id}
            patient={patient}
            onPress={this._viewPatient}
          />
        ))}
        <Button
          enabled={true}
          label="Log Out"
          primary={false}
          style={styles.button}
          onPress={this._logout}
        />
      </View>
    );
  }
}

interface PatientRowProps {
  patient: Patient;
  onPress: (id: number) => void;
}

class PatientRow extends React.Component<PatientRowProps> {
  _onPress = () => {
    this.props.onPress(this.props.patient.id);
  };

  render() {
    return (
      <TouchableOpacity style={styles.patient} onPress={this._onPress}>
        <Text>{this.props.patient.name}</Text>
      </TouchableOpacity>
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
  patient: {
    height: INPUT_HEIGHT
  }
});

export default connect((state: StoreState) => ({
  patients: state.patients
}))(Patients);
