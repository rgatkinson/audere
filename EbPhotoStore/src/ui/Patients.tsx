import React from "react";
import {
  FlatList,
  StyleSheet,
  TouchableOpacity,
  View,
  PermissionsAndroid
} from "react-native";
import { connect } from "react-redux";
import { WithNamespaces, withNamespaces } from "react-i18next";
import {
  setEvdStatus,
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
import firebase from "react-native-firebase";

interface Props {
  demoMode: boolean;
  patients: PatientEncounter[];
  setupBackInfo(s: Screen, onBack: () => void): void;
  dispatch(action: Action): void;
}

class Patients extends React.Component<Props & WithNamespaces> {
  async componentDidMount() {
    this.props.setupBackInfo(Screen.Patients, this._logout);
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
    firebase.auth().signOut();
    this.props.dispatch(logout());
  };

  _keyExtractor = (patient: PatientEncounter) => {
    return patient.id.toString();
  };

  _onLongPress = (id: number) => {
    const { demoMode } = this.props;
    if (demoMode) {
      const { dispatch, patients } = this.props;
      dispatch(setEvdStatus(id, !patients[id].evdPositive));
    }
  };

  render() {
    const { t } = this.props;
    return (
      <View style={styles.container}>
        <View style={styles.rowContainer}>
          <Title
            label={t("patientList")}
            style={{ flex: 1, marginTop: GUTTER }}
          />
          <Button
            enabled={true}
            label={t("addNewPatient")}
            primary={true}
            style={[styles.button, { flex: 1, marginBottom: 0 }]}
            onPress={this._addPatient}
          />
        </View>
        <FlatList
          data={this.props.patients}
          keyExtractor={this._keyExtractor}
          renderItem={({ item }) => (
            <PatientRow
              patient={item}
              onPress={this._viewPatient}
              onLongPress={this._onLongPress}
            />
          )}
        />
        <Button
          enabled={true}
          label={t("logOut")}
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
  onLongPress: (id: number) => void;
  onPress: (id: number) => void;
}

class PatientRow extends React.Component<PatientRowProps> {
  _onPress = () => {
    this.props.onPress(this.props.patient.id);
  };

  _onLongPress = () => {
    this.props.onLongPress(this.props.patient.id);
  };

  _getPatientName = () => {
    const { patient } = this.props;
    return (
      patient.patientInfo.lastName +
      ", " +
      patient.patientInfo.firstName +
      " (ID: " +
      patient.id +
      ")"
    );
  };

  render() {
    const { patient } = this.props;
    return (
      <TouchableOpacity onPress={this._onPress} onLongPress={this._onLongPress}>
        <View style={[styles.patient, patient.evdPositive && styles.evdPos]}>
          <Text content={this._getPatientName()} style={styles.patientName} />
          {patient.evdPositive && (
            <Text content="Ebola +" style={styles.patientStatus} />
          )}
        </View>
      </TouchableOpacity>
    );
  }
}

const styles = StyleSheet.create({
  container: {
    alignSelf: "stretch",
    flex: 1,
    justifyContent: "center",
    margin: GUTTER
  },
  rowContainer: {
    flexDirection: "row",
    alignItems: "center"
  },
  button: {
    alignSelf: "center"
  },
  evdPos: {
    backgroundColor: "pink"
  },
  patient: {
    borderBottomColor: BORDER_COLOR,
    borderBottomWidth: StyleSheet.hairlineWidth,
    flexDirection: "row",
    height: INPUT_HEIGHT,
    paddingHorizontal: GUTTER / 2,
    paddingTop: GUTTER
  },
  patientName: {
    flex: 3
  },
  patientStatus: {
    flex: 1,
    fontWeight: "bold"
  }
});

export default connect((state: StoreState) => ({
  demoMode: state.meta.demoMode,
  patients: state.patients
}))(withNamespaces("patients")(Patients));
