import React, { Fragment } from "react";
import { Alert, AppState, BackHandler, StatusBar, View } from "react-native";
import { connect } from "react-redux";
import firebase from "react-native-firebase";
import i18n from "i18next";
import {
  logout,
  viewPatients,
  viewDetails,
  Action,
  Screen,
  StoreState,
  setFcmToken,
} from "../store";
import Login from "./Login";
import Patients from "./Patients";
import Details from "./Details";
import CameraPermissionRequired from "./CameraPermissionRequired";
import LocationPermissionRequired from "./LocationPermissionRequired";
import PhotoCapture from "./PhotoCapture";
import TitleBar from "./components/TitleBar";
import AppMenu from "./AppMenu";
import { TITLEBAR_COLOR } from "./styles";

interface Props {
  currentPatient?: number;
  fcmToken?: string;
  screen: Screen;
  dispatch(action: Action): void;
}

export interface BackCallback {
  onBack(): void;
  shouldShowBack?(): boolean;
  backText?: string;
}

interface State {
  showAppMenu: boolean;
  appState: string;
}

class AppController extends React.Component<Props, State> {
  state: State = {
    showAppMenu: false,
    appState: AppState.currentState,
  };
  _backHandler: any;
  _onBackCallbacks: { [s: string]: BackCallback } = {};
  _onTokenRefreshListener: any;
  _notificationListener: any;

  async componentDidMount() {
    this._backHandler = BackHandler.addEventListener(
      "hardwareBackPress",
      this._handleBackPress
    );

    AppState.addEventListener("change", this._handleAppStateChange);

    await this._checkNotificationPermissions();

    this._onTokenRefreshListener = firebase
      .messaging()
      .onTokenRefresh((fcmToken: string) => {
        this.props.dispatch(setFcmToken(fcmToken));
      });

    const hasPermission = await this._requestPermission();

    if (hasPermission) {
      this._createNotificationListeners();
    }
  }

  componentWillUnmount() {
    if (this._backHandler != null) {
      this._backHandler.remove();
    }

    if (this._onTokenRefreshListener != null) {
      this._onTokenRefreshListener();
    }

    if (this._notificationListener != null) {
      this._notificationListener();
    }

    AppState.removeEventListener("change", this._handleAppStateChange);
  }

  _handleAppStateChange = (nextAppState: string) => {
    this.setState({ appState: nextAppState });
  };

  _showAlert(title: string, body: string, patientId?: string) {
    Alert.alert(
      title,
      body,
      [
        {
          text: i18n.t("common:ok"),
          onPress: () => {
            if (this.props.screen !== "LOGIN" && patientId) {
              this.props.dispatch(viewDetails(parseInt(patientId)));
            }
          },
        },
      ],
      { cancelable: false }
    );
  }

  shouldComponentUpdate(props: Props, state: State) {
    return (
      props.screen !== this.props.screen ||
      state.showAppMenu !== this.state.showAppMenu
    );
  }

  _setupBackInfo = (s: Screen, info: BackCallback) => {
    this._onBackCallbacks[s] = info;
    this.forceUpdate();
  };

  _shouldShowBack = () => {
    return (
      (!!this._onBackCallbacks[this.props.screen] &&
        (!this._onBackCallbacks[this.props.screen].shouldShowBack ||
          this._onBackCallbacks[this.props.screen].shouldShowBack!())) ||
      [
        Screen.Camera,
        Screen.LocationPermission,
        Screen.CameraPermission,
      ].findIndex(e => {
        return e === this.props.screen;
      }) >= 0
    );
  };

  _createNotificationListeners = async () => {
    // Notification received in foreground
    this._notificationListener = firebase
      .notifications()
      .onNotification(notification => {
        const { body, title } = notification;
        if (this.state.appState.match(/inactive|background/)) {
          this._showAlert(title, body, notification.data.localIndex);
        }
      });
  };

  _checkNotificationPermissions = async () => {
    const enabled = await firebase.messaging().hasPermission();
    if (enabled) {
      this._getToken();
    } else {
      this._requestPermission();
    }
  };

  _getToken = async () => {
    let fcmToken = this.props.fcmToken;
    if (!fcmToken) {
      fcmToken = await firebase.messaging().getToken();
      if (fcmToken) {
        this.props.dispatch(setFcmToken(fcmToken));
      }
    }
  };

  _requestPermission = async () => {
    try {
      await firebase.messaging().requestPermission();
      await this._getToken();
      return true;
    } catch (error) {
      return false;
    }
  };

  _handleBackPress = () => {
    if (!!this._onBackCallbacks[this.props.screen]) {
      this._onBackCallbacks[this.props.screen].onBack();
      return true;
    } else {
      switch (this.props.screen) {
        case Screen.Patients:
          this.props.dispatch(logout());
          return true;
        case Screen.Camera:
          this.props.dispatch(viewDetails(this.props.currentPatient!));
          return true;
        case Screen.LocationPermission:
          this.props.dispatch(viewPatients());
          return true;
        case Screen.CameraPermission:
          this.props.dispatch(viewDetails(this.props.currentPatient!));
          return true;
      }
      return false;
    }
  };

  _handleMenuPress = () => {
    this.setState({ showAppMenu: !this.state.showAppMenu });
  };

  _handleMenuDismiss = () => {
    this.setState({ showAppMenu: false });
  };

  _getScreen = () => {
    switch (this.props.screen) {
      case Screen.Login:
        return <Login />;
      case Screen.Patients:
        return <Patients setupBackInfo={this._setupBackInfo} />;
      case Screen.PatientDetails:
        return (
          <Details
            id={this.props.currentPatient}
            setupBackInfo={this._setupBackInfo}
          />
        );
      case Screen.Camera:
        return <PhotoCapture id={this.props.currentPatient} />;
      case Screen.LocationPermission:
        return <LocationPermissionRequired />;
      case Screen.CameraPermission:
        return <CameraPermissionRequired />;
    }
  };

  render() {
    return (
      <Fragment>
        <View
          style={[
            {
              alignSelf: "stretch",
              backgroundColor: TITLEBAR_COLOR,
              width: "100%",
            },
          ]}
        >
          <StatusBar
            backgroundColor="transparent"
            barStyle="dark-content"
            translucent={true}
          />
          <TitleBar
            onBack={this._shouldShowBack() && this._handleBackPress}
            backText={
              !!this._onBackCallbacks[this.props.screen] &&
              this._onBackCallbacks[this.props.screen].backText
            }
            onMenu={this._handleMenuPress}
          />
        </View>
        <AppMenu
          visible={this.state.showAppMenu}
          onDismiss={this._handleMenuDismiss}
        />
        {this._getScreen()}
      </Fragment>
    );
  }
}
export default connect((state: StoreState) => ({
  currentPatient: state.meta.currentPatient,
  fcmToken: state.meta.fcmToken,
  screen: state.meta.screen,
}))(AppController);
