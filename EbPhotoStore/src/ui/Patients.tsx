import React from "react";
import {
  Dimensions,
  FlatList,
  Image,
  StyleSheet,
  TouchableOpacity,
  View,
} from "react-native";
import { connect } from "react-redux";
import { WithNamespaces, withNamespaces } from "react-i18next";
import memoize from "memoize-one";
import {
  saveSort,
  setEvdStatus,
  viewDetails,
  logout,
  Action,
  Order,
  PatientEncounter,
  Screen,
  Sort,
  StoreState,
} from "../store";
import Button from "./components/Button";
import Text from "./components/Text";
import Title from "./components/Title";
import {
  BORDER_COLOR,
  EBOLA_POSITIVE_COLOR,
  GUTTER,
  ICON_SIZE,
  INPUT_HEIGHT,
  REGULAR_TEXT,
} from "./styles";
import firebase from "react-native-firebase";
import { BackCallback } from "./AppController";

interface Props {
  demoMode: boolean;
  patients: PatientEncounter[];
  setupBackInfo(s: Screen, info: BackCallback): void;
  sortBy: Sort[];
  order: Order;
  dispatch(action: Action): void;
}

interface State {
  sortBy: Sort[];
  order: Order;
}

class Patients extends React.Component<Props & WithNamespaces, State> {
  constructor(props: Props & WithNamespaces) {
    super(props);
    this.state = {
      sortBy: props.sortBy,
      order: props.order,
    };
  }

  async componentDidMount() {
    this.props.setupBackInfo(Screen.Patients, {
      onBack: this._logout,
      shouldShowBack: () => {
        return false;
      },
    });
  }

  _nameSort = (a: PatientEncounter, b: PatientEncounter) => {
    if (!!a.patientInfo.lastName.localeCompare(b.patientInfo.lastName)) {
      return a.patientInfo.lastName.localeCompare(b.patientInfo.lastName);
    }
    return a.patientInfo.firstName.localeCompare(b.patientInfo.firstName);
  };

  _statusSort = (a: PatientEncounter, b: PatientEncounter) => {
    if (a.evdPositive === b.evdPositive) {
      return 0;
    }

    if (a.evdPositive) {
      return -1;
    } else if (b.evdPositive) {
      return 1;
    } else if (a.evdPositive !== undefined) {
      return -1;
    }

    return 1; // b.evdPositive !== undefined
  };

  _infoSort = (a: PatientEncounter, b: PatientEncounter) => {
    const uid = firebase.auth().currentUser!.uid;
    const aHasChat =
      a.messages.length > 0 &&
      a.messages.filter(message => message.sender.uid !== uid).length > 0;
    const bHasChat =
      b.messages.length > 0 &&
      b.messages.filter(message => message.sender.uid !== uid).length > 0;
    const aMissingPhoto = a.photoInfo.length === 0;
    const bMissingPhoto = b.photoInfo.length === 0;

    if (aHasChat === bHasChat && aMissingPhoto === bMissingPhoto) {
      return 0;
    }

    if (aHasChat && !bHasChat) {
      return -1;
    } else if (bHasChat && !aHasChat) {
      return 1;
    } else if (aMissingPhoto) {
      return -1;
    }

    return 1; // bMissinPhoto
  };

  _performSort = (a: PatientEncounter, b: PatientEncounter, sortBy: Sort[]) => {
    for (var i = 0; i < sortBy.length; i++) {
      switch (sortBy[i]) {
        case Sort.id:
          return a.id - b.id;
        case Sort.name:
          const nameSort = this._nameSort(a, b);
          if (!!nameSort) {
            return nameSort;
          }
          continue;
        case Sort.status:
          const statusSort = this._statusSort(a, b);
          if (!!statusSort) {
            return statusSort;
          }
          continue;
        case Sort.info:
          const infoSort = this._infoSort(a, b);
          if (!!infoSort) {
            return infoSort;
          }
          continue;
      }
    }
    return a.id - b.id;
  };

  _sort = memoize(
    (patients: PatientEncounter[], sortBy: Sort[], order: Order) => {
      return [...patients].sort((a, b) => {
        const multiplier = order === Order.down ? 1 : -1;
        return multiplier * this._performSort(a, b, sortBy);
      });
    }
  );

  _addPatient = () => {
    this.props.dispatch(saveSort(this.state.sortBy, this.state.order));
    this.props.dispatch(viewDetails(this.props.patients.length));
  };

  _viewPatient = (id: number) => {
    this.props.dispatch(saveSort(this.state.sortBy, this.state.order));
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
      dispatch(
        setEvdStatus(
          id,
          !patients[id].evdPositive,
          { uid: "333", name: "Dr. Michael" },
          new Date().toISOString()
        )
      );
    }
  };

  _sortBy = (sort: Sort) => {
    if (this.state.sortBy[0] === sort) {
      this.setState({
        order: this.state.order === Order.down ? Order.up : Order.down,
      });
    } else {
      this.setState({
        sortBy: [sort, ...this.state.sortBy.filter(s => s != sort)],
      });
    }
  };

  _sortByName = () => {
    this._sortBy(Sort.name);
  };

  _sortByStatus = () => {
    this._sortBy(Sort.status);
  };

  _sortByInfo = () => {
    this._sortBy(Sort.info);
  };

  _sortById = () => {
    this._sortBy(Sort.id);
  };

  _arrow = () => {
    return (
      <Image
        source={{
          uri: this.state.order === Order.down ? "arrowdown" : "arrowup",
        }}
        style={styles.arrow}
      />
    );
  };

  render() {
    const { patients, t } = this.props;
    const patientsToRender = this._sort(
      patients,
      this.state.sortBy,
      this.state.order
    );
    return (
      <View style={styles.container}>
        <View style={[styles.rowContainer, { marginBottom: GUTTER }]}>
          <Title label={t("patients")} style={{ marginBottom: 0 }} />
          <Button
            enabled={true}
            label={t("plus")}
            primary={true}
            onPress={this._addPatient}
            fontSize={40}
            style={styles.button}
          />
        </View>
        <View style={styles.rowContainer}>
          <TouchableOpacity
            style={[styles.name, { flexDirection: "row" }]}
            onPress={this._sortByName}
          >
            <Text bold={true} content={t("name")} style={styles.header} />
            {this.state.sortBy[0] === Sort.name && this._arrow()}
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.id, { flexDirection: "row" }]}
            onPress={this._sortById}
          >
            <Text bold={true} content={t("id")} style={styles.header} />
            {this.state.sortBy[0] === Sort.id && this._arrow()}
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.status, { flexDirection: "row" }]}
            onPress={this._sortByStatus}
          >
            <Text bold={true} content={t("status")} style={styles.header} />
            {this.state.sortBy[0] === Sort.status && this._arrow()}
          </TouchableOpacity>
          <TouchableOpacity
            style={[
              styles.iconContainer,
              { flexDirection: "row", paddingTop: 1 },
            ]}
            onPress={this._sortByInfo}
          >
            <Text
              bold={true}
              content={t("info")}
              style={[styles.header, styles.unicodeHeader]}
            />
            {this.state.sortBy[0] === Sort.info && this._arrow()}
          </TouchableOpacity>
        </View>
        <FlatList
          data={patientsToRender}
          extraData={patients}
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
      (patient.patientInfo.lastName.length > 0 ? ", " : "") +
      patient.patientInfo.firstName
    );
  };

  render() {
    const { patient, t } = this.props;
    const uid = firebase.auth().currentUser!.uid;
    const hasChat = patient.messages.some(
      message =>
        message.sender.uid !== uid &&
        new Date(message.timestamp).getTime() > patient.messageLastViewedAt
    );
    const hasPhoto = patient.photoInfo.length > 0;
    return (
      <TouchableOpacity onPress={this._onPress} onLongPress={this._onLongPress}>
        <View style={styles.patient}>
          <Text
            content={this._getPatientName()}
            numberOfLines={1}
            ellipsizeMode="tail"
            style={styles.name}
          />
          <Text
            content={patient.id.toString().padStart(3, "0")}
            style={styles.id}
          />
          {patient.evdPositive !== undefined ? (
            <Text
              bold={true}
              content={t(patient.evdPositive ? "evdPositive" : "evdNegative")}
              style={[styles.status, patient.evdPositive && styles.evdPos]}
            />
          ) : (
            <View style={styles.status} />
          )}
          <View style={styles.iconContainer}>
            {hasChat ? (
              <Image source={{ uri: "messageicon" }} style={styles.icon} />
            ) : !hasPhoto ? (
              <Image source={{ uri: "photoneeded" }} style={styles.icon} />
            ) : null}
          </View>
        </View>
      </TouchableOpacity>
    );
  }
}
const PatientRow = withNamespaces("patients")(PatientRowImpl);

// Row width: screen gutter * 2 plus half gutter padding within row + icon gutter
const rowWidth = Dimensions.get("window").width - 4 * GUTTER - ICON_SIZE;

const styles = StyleSheet.create({
  button: {
    borderRadius: 2,
    marginBottom: 0,
    width: INPUT_HEIGHT,
  },
  container: {
    alignSelf: "stretch",
    flex: 1,
    justifyContent: "center",
    margin: GUTTER,
  },
  rowContainer: {
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "space-between",
    paddingHorizontal: GUTTER / 2,
  },
  patient: {
    borderBottomColor: BORDER_COLOR,
    borderBottomWidth: StyleSheet.hairlineWidth,
    flexDirection: "row",
    height: INPUT_HEIGHT,
    paddingHorizontal: GUTTER / 2,
    paddingTop: GUTTER,
  },
  name: {
    marginBottom: 0,
    paddingRight: GUTTER / 2,
    width: rowWidth * 0.55,
  },
  unicodeHeader: {
    lineHeight: REGULAR_TEXT + 2,
  },
  header: {
    color: "#014080",
    lineHeight: REGULAR_TEXT,
    marginBottom: 0,
  },
  id: {
    paddingRight: GUTTER / 2,
    width: rowWidth * 0.15,
  },
  status: {
    width: rowWidth * 0.3,
    paddingRight: GUTTER / 2,
  },
  iconContainer: {
    width: ICON_SIZE + GUTTER,
  },
  icon: {
    height: ICON_SIZE,
    marginBottom: (INPUT_HEIGHT - ICON_SIZE) / 2,
    resizeMode: "contain",
    width: ICON_SIZE,
  },
  arrow: {
    height: 12,
    marginLeft: 2,
    marginTop: 2,
    resizeMode: "contain",
    width: 12,
  },
  evdPos: {
    color: EBOLA_POSITIVE_COLOR,
  },
});

export default connect((state: StoreState) => ({
  demoMode: state.meta.demoMode,
  patients: state.patients,
  sortBy: state.meta.sortBy,
  order: state.meta.order,
}))(withNamespaces("patients")(Patients));
