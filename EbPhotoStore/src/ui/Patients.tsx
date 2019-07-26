import React from "react";
import { FlatList, StyleSheet, TouchableOpacity, View } from "react-native";
import { connect } from "react-redux";
import { PermissionsAndroid } from "react-native";
import {
  viewDetails,
  logout,
  Action,
  PatientEncounter,
  Screen,
  StoreState
} from "../store";
import Button from "./components/Button";
import Text from "./components/Text";
import Title from "./components/Title";
import { BORDER_COLOR, GUTTER, INPUT_HEIGHT } from "./styles";

interface Props {
  patients: PatientEncounter[];
  dispatch(action: Action): void;
}

class Patients extends React.Component<Props> {
  async componentDidMount() {
    await this.requestLocationPermission();
  }

  async requestLocationPermission() {
    try {
      const granted = await PermissionsAndroid.request(
        PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION,
        {
          title: "EVD Track Location Permission",
          message:
            "EVD Track needs access to your location" +
            "so it can accurately report patient data.",
          buttonNegative: "Cancel",
          buttonPositive: "OK"
        }
      );
    } catch (err) {
      console.warn(err);
    }
  }

  _addPatient = () => {
    this.props.dispatch(viewDetails(this.props.patients.length));
  };

  _viewPatient = (id: number) => {
    this.props.dispatch(viewDetails(id));
  };

  _logout = () => {
    this.props.dispatch(logout());
  };

  _keyExtractor = (patient: PatientEncounter) => {
    return patient.id.toString();
  };

  render() {
    return (
      <View style={styles.container}>
        <Title label="Patient List" />
        <Button
          enabled={true}
          label="+ Add New Patient"
          primary={true}
          style={styles.button}
          onPress={this._addPatient}
        />
        <FlatList
          data={this.props.patients}
          keyExtractor={this._keyExtractor}
          renderItem={({ item }) => (
            <PatientRow patient={item} onPress={this._viewPatient} />
          )}
        />
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
  patient: PatientEncounter;
  onPress: (id: number) => void;
}

class PatientRow extends React.Component<PatientRowProps> {
  _onPress = () => {
    this.props.onPress(this.props.patient.id);
  };

  render() {
    return (
      <TouchableOpacity style={styles.patient} onPress={this._onPress}>
        <Text
          content={
            this.props.patient.patientInfo.lastName +
            ", " +
            this.props.patient.patientInfo.firstName +
            " (ID: " +
            this.props.patient.id +
            ")"
          }
        />
      </TouchableOpacity>
    );
  }
}

const styles = StyleSheet.create({
  button: {
    alignSelf: "center",
    margin: GUTTER
  },
  container: {
    alignSelf: "stretch",
    flex: 1,
    justifyContent: "center",
    margin: GUTTER
  },
  patient: {
    borderBottomColor: BORDER_COLOR,
    borderBottomWidth: StyleSheet.hairlineWidth,
    height: INPUT_HEIGHT,
    paddingTop: GUTTER
  }
});

export default connect((state: StoreState) => ({
  patients: state.patients
}))(Patients);
