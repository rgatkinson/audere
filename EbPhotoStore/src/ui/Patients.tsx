import React from "react";
import {
  FlatList,
  Image,
  StyleSheet,
  TouchableOpacity,
  View
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
import { ADD_PHOTO_IMAGE, BORDER_COLOR, GUTTER, INPUT_HEIGHT } from "./styles";
import firebase from "react-native-firebase";
import { BackCallback } from "./AppController";

interface Props {
  demoMode: boolean;
  patients: PatientEncounter[];
  setupBackInfo(s: Screen, info: BackCallback): void;
  dispatch(action: Action): void;
}

interface State {
  patients: PatientEncounter[];
}

class Patients extends React.Component<Props & WithNamespaces, State> {
  state: State = {
    patients: []
  };

  async componentDidMount() {
    this.props.setupBackInfo(Screen.Patients, {
      onBack: this._logout,
      shouldShowBack: () => {
        return false;
      }
    });
  }

  static getDerivedStateFromProps(props: Props, state: State) {
    if (props.patients.length != state.patients.length) {
      return {
        patients: [...props.patients].sort((a, b) => {
          if (!!a.patientInfo.lastName.localeCompare(b.patientInfo.lastName)) {
            return a.patientInfo.lastName.localeCompare(b.patientInfo.lastName);
          } else if (
            !!a.patientInfo.firstName.localeCompare(b.patientInfo.firstName)
          ) {
            return a.patientInfo.firstName.localeCompare(
              b.patientInfo.firstName
            );
          } else {
            return a.id - b.id;
          }
        })
      };
    }
    return null;
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
            style={{ flex: 2, marginTop: GUTTER }}
          />
          <Button
            enabled={true}
            label={t("addNewPatient")}
            primary={true}
            style={{ flex: 1, marginBottom: 0 }}
            onPress={this._addPatient}
            small={true}
          />
        </View>
        <FlatList
          data={this.state.patients}
          keyExtractor={this._keyExtractor}
          renderItem={({ item }) => (
            <PatientRow
              patient={item}
              onPress={this._viewPatient}
              onLongPress={this._onLongPress}
            />
          )}
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

class PatientRowImpl extends React.Component<PatientRowProps & WithNamespaces> {
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
    const { patient, t } = this.props;
    return (
      <TouchableOpacity onPress={this._onPress} onLongPress={this._onLongPress}>
        <View style={[styles.patient, patient.evdPositive && styles.evdPos]}>
          <Text content={this._getPatientName()} style={styles.patientName} />
          {patient.evdPositive !== undefined && (
            <Text
              content={t(patient.evdPositive ? "evdPositive" : "evdNegative")}
              style={styles.patientStatus}
            />
          )}
          <View style={styles.patientChat}>
            {!patient.photoInfo.length ? (
              <Image source={ADD_PHOTO_IMAGE} style={styles.patientStatusImg} />
            ) : (
              /*TODO: chat bubble*/ false && <Text content="&#x1f4ac;" />
            )}
          </View>
        </View>
      </TouchableOpacity>
    );
  }
}
const PatientRow = withNamespaces("patients")(PatientRowImpl);

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
    flex: 4
  },
  patientStatus: {
    flex: 1,
    fontWeight: "bold"
  },
  patientChat: {
    width: 30
  },
  patientStatusImg: {
    width: 24,
    height: 24
  }
});

export default connect((state: StoreState) => ({
  demoMode: state.meta.demoMode,
  patients: state.patients
}))(withNamespaces("patients")(Patients));
