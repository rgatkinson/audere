import React, { Fragment } from "react";
import {
  Animated,
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
  viewPatient,
} from "../store";
import Text from "./components/Text";
import {
  BORDER_COLOR,
  EBOLA_POSITIVE_COLOR,
  GUTTER,
  ICON_SIZE,
  INPUT_HEIGHT,
  LOGO_HEIGHT,
  MESSAGES_LABEL_IMAGE,
  NEW_MESSAGE_IMAGE,
  REGULAR_TEXT,
  TRIAGE_POSITIVE_IMAGE,
  TRIAGE_NEGATIVE_IMAGE,
  TRIAGE_NEED_PHOTO_IMAGE,
} from "./styles";
import firebase from "react-native-firebase";
import { TitlebarCallback } from "./AppController";
import TitleBar from "./TitleBar";

interface Props {
  demoMode: boolean;
  patients: PatientEncounter[];
  setupTitlebarInfo(s: Screen, info: TitlebarCallback): void;
  sortBy: Sort[];
  order: Order;
  dispatch(action: Action): void;
}

interface State {
  sortBy: Sort[];
  order: Order;
  searchText: string;
  animScrollY: Animated.Value;
}

const TITLE_HEIGHT = LOGO_HEIGHT + GUTTER;

class Patients extends React.Component<Props & WithNamespaces, State> {
  _scrollView: any;

  constructor(props: Props & WithNamespaces) {
    super(props);
    this.state = {
      sortBy: props.sortBy,
      order: props.order,
      searchText: "",
      animScrollY: new Animated.Value(0),
    };
  }

  async componentDidMount() {
    this.props.setupTitlebarInfo(Screen.Patients, {
      onBack: this._logout,
      shouldShowTitlebar: () => {
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
    if (a.evdPositive !== undefined && a.evdPositive === b.evdPositive) {
      return this._nameSort(a, b);
    } else if (a.evdPositive) {
      return -1;
    } else if (b.evdPositive) {
      return 1;
    } else if (a.evdPositive !== undefined) {
      return -1;
    } else if (b.evdPositive !== undefined) {
      return 1;
    }

    const needPhotoA = a.photoInfo.length === 0;
    const needPhotoB = b.photoInfo.length === 0;
    if (needPhotoA === needPhotoB) {
      return this._nameSort(a, b);
    } else if (!needPhotoA) {
      return 1;
    }
    return -1; //!needPhotoB
  };

  _infoSort = (a: PatientEncounter, b: PatientEncounter) => {
    const uid = firebase.auth().currentUser!.uid;
    const aHasChat = a.messages.some(
      message =>
        message.sender.uid !== uid &&
        new Date(message.timestamp).getTime() > a.messageLastViewedAt
    );
    const bHasChat = b.messages.some(
      message =>
        message.sender.uid !== uid &&
        new Date(message.timestamp).getTime() > b.messageLastViewedAt
    );

    if (aHasChat === bHasChat) {
      return this._nameSort(a, b);
    } else if (aHasChat && !bHasChat) {
      return -1;
    }
    return 1; //(bHasChat && !aHasChat)
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

  _performFilter = (p: PatientEncounter, filterText: string) => {
    if (filterText.length == 0) {
      return true;
    }
    return (
      p.patientInfo.firstName.toLowerCase().indexOf(filterText) >= 0 ||
      p.patientInfo.lastName.toLowerCase().indexOf(filterText) >= 0 ||
      (filterText === "+" && p.evdPositive) ||
      (filterText === "-" && p.evdPositive === false) ||
      p.id
        .toString()
        .padStart(3, "0")
        .indexOf(filterText) >= 0
    );
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
    this.props.dispatch(viewPatient(this.props.patients.length));
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

  _onSearchTextChanged = (searchText: string) => {
    this.setState({ searchText });
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

  _onScrollEndSnapToEdge = event => {
    if (this._scrollView) {
      const y = event.nativeEvent.contentOffset.y;
      if (0 < y && y < TITLE_HEIGHT / 2) {
        this._scrollView.scrollTo({ y: 0 });
      } else if (TITLE_HEIGHT / 2 <= y && y < TITLE_HEIGHT) {
        this._scrollView.scrollTo({ y: TITLE_HEIGHT });
      }
    }
  };

  render() {
    const { patients, t } = this.props;
    let patientsToRender = this._sort(
      patients,
      this.state.sortBy,
      this.state.order
    );
    const { animScrollY, searchText } = this.state;
    if (searchText && searchText.length > 0) {
      patientsToRender = patientsToRender.filter(p =>
        this._performFilter(p, searchText.toLowerCase())
      );
    }
    let offsetY = animScrollY.interpolate({
      inputRange: [0, TITLE_HEIGHT, TITLE_HEIGHT + 1],
      outputRange: [0, 0, 1],
    });
    return (
      <Fragment>
        <Animated.ScrollView
          ref={scrollView => {
            this._scrollView = scrollView ? scrollView._component : null;
          }}
          keyboardShouldPersistTaps="handled"
          onScrollEndDrag={this._onScrollEndSnapToEdge}
          onMomentumScrollEnd={this._onScrollEndSnapToEdge}
          onScroll={Animated.event(
            [{ nativeEvent: { contentOffset: { y: animScrollY } } }],
            { useNativeDriver: true }
          )}
        >
          <Animated.View
            style={[
              {
                marginBottom: 0,
                transform: [{ translateY: offsetY }],
                flexDirection: "column",
                zIndex: 1,
              },
            ]}
          >
            <TitleBar
              animScrollY={animScrollY}
              showLogo={true}
              showAppMenuButton={true}
              showBottomBorder={true}
              titlebarText={t("titlebarText")}
              onSearchTextChanged={this._onSearchTextChanged}
              onNew={this._addPatient}
            />
          </Animated.View>
          <View style={styles.headerContainer}>
            <TouchableOpacity
              style={[styles.name, { flexDirection: "row" }]}
              onPress={this._sortByName}
            >
              <Text bold={true} content={t("name")} style={styles.header} />
              {this.state.sortBy[0] === Sort.name && this._arrow()}
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.statusContainer, { flexDirection: "row" }]}
              onPress={this._sortByStatus}
            >
              <Text bold={true} content={t("status")} style={styles.header} />
              {this.state.sortBy[0] === Sort.status && this._arrow()}
            </TouchableOpacity>
            <TouchableOpacity
              style={[
                styles.iconContainer,
                { flexDirection: "row", paddingTop: GUTTER / 2 },
              ]}
              onPress={this._sortByInfo}
            >
              <Image source={MESSAGES_LABEL_IMAGE} style={styles.icon} />
              {this.state.sortBy[0] === Sort.info && this._arrow()}
            </TouchableOpacity>
          </View>
          <View style={styles.listContainer}>
            <FlatList
              data={patientsToRender}
              extraData={patients}
              keyExtractor={this._keyExtractor}
              keyboardShouldPersistTaps="handled"
              renderItem={({ item }) => (
                <PatientRow
                  patient={item}
                  onPress={this._viewPatient}
                  onLongPress={this._onLongPress}
                />
              )}
            />
          </View>
        </Animated.ScrollView>
      </Fragment>
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
      <Fragment>
        <View style={styles.border} />
        <TouchableOpacity
          onPress={this._onPress}
          onLongPress={this._onLongPress}
        >
          <View style={styles.patientRow}>
            <Text
              content={this._getPatientName()}
              numberOfLines={1}
              ellipsizeMode="tail"
              style={styles.name}
            />
            <View style={styles.statusContainer}>
              {patient.evdPositive !== undefined ? (
                <Fragment>
                  <Image
                    source={
                      patient.evdPositive
                        ? TRIAGE_POSITIVE_IMAGE
                        : TRIAGE_NEGATIVE_IMAGE
                    }
                    style={styles.icon}
                  />
                  <Text
                    bold={patient.evdPositive}
                    content={" " + t("evd")}
                    style={patient.evdPositive && styles.evdPos}
                  />
                </Fragment>
              ) : !hasPhoto ? (
                <Fragment>
                  <Image source={TRIAGE_NEED_PHOTO_IMAGE} style={styles.icon} />
                  <Text content={" " + t("needphoto")} />
                </Fragment>
              ) : (
                <View style={styles.icon} />
              )}
            </View>
            <View style={styles.iconContainer}>
              {hasChat && (
                <Image source={NEW_MESSAGE_IMAGE} style={styles.icon} />
              )}
            </View>
          </View>
        </TouchableOpacity>
      </Fragment>
    );
  }
}
const PatientRow = withNamespaces("patients")(PatientRowImpl);

// Row width: screen gutter * 2 plus icon gutter
const rowWidth = Dimensions.get("window").width - 2 * GUTTER - ICON_SIZE;

const styles = StyleSheet.create({
  headerContainer: {
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "space-between",
    backgroundColor: "white",
    paddingHorizontal: GUTTER,
    paddingTop: GUTTER,
    paddingBottom: GUTTER / 2,
  },
  header: {
    color: "#014080",
    lineHeight: REGULAR_TEXT,
    marginBottom: 0,
  },
  iconContainer: {
    width: ICON_SIZE,
  },
  icon: {
    marginBottom: (INPUT_HEIGHT - ICON_SIZE) / 2,
    resizeMode: "contain",
    width: ICON_SIZE,
    height: ICON_SIZE,
  },
  arrow: {
    height: 12,
    marginLeft: 2,
    marginTop: 2,
    resizeMode: "contain",
    width: 12,
  },
  listContainer: {
    alignSelf: "stretch",
    flex: 1,
    justifyContent: "center",
    paddingHorizontal: GUTTER,
    backgroundColor: "white",
    marginVertical: 0,
  },
  patientRow: {
    flexDirection: "row",
    height: INPUT_HEIGHT,
    paddingTop: GUTTER,
  },
  border: {
    borderTopColor: BORDER_COLOR,
    borderTopWidth: StyleSheet.hairlineWidth,
  },
  name: {
    marginBottom: 0,
    paddingRight: GUTTER / 2,
    width: rowWidth * 0.6,
  },
  statusContainer: {
    width: rowWidth * 0.4,
    paddingRight: GUTTER / 2,
    flexDirection: "row",
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
