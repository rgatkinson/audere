import React, { Fragment } from "react";
import { Alert, AppState, BackHandler } from "react-native";
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
import CameraPermissionRequired from "./CameraPermissionRequired";
import LocationPermissionRequired from "./LocationPermissionRequired";
import PhotoCapture from "./PhotoCapture";
import TitleBar from "./TitleBar";
import { NotificationOpen } from "react-native-firebase/notifications";
import PatientDetails from "./PatientDetails";
import Details from "./Details";

interface Props {
  currentPatient?: number;
  fcmToken?: string;
  screen: Screen;
  dispatch(action: Action): void;
}

export interface TitlebarCallback {
  onBack(): void;
  shouldShowTitlebar?(): boolean;
  getTitlebarText?(): string;
}

interface State {
  appState: string;
}

class AppController extends React.Component<Props, State> {
  state: State = {
    appState: AppState.currentState,
  };
  _backHandler: any;
  _channel: any;
  _titlebarCallbacks: { [s: string]: TitlebarCallback } = {};
  _onTokenRefreshListener: any;
  _notificationListener: any;
  _notificationOpenedListener: any;

  async componentDidMount() {
    this._backHandler = BackHandler.addEventListener(
      "hardwareBackPress",
      this._handleBackPress
    );

    AppState.addEventListener("change", this._handleAppStateChange);

    const channelConfig = {
      channelId: "eb_photo_store",
      channelName: "Channel Name",
    };

    this._channel = new firebase.notifications.Android.Channel(
      channelConfig.channelId,
      channelConfig.channelName,
      firebase.notifications.Android.Importance.Max
    ).setDescription("A natural description of the channel");
    firebase.notifications().android.createChannel(this._channel);

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

    firebase.notifications().android.deleteChannel("eb_photo_store");
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
    return props.screen !== this.props.screen;
  }

  _setupTitlebarInfo = (s: Screen, info: TitlebarCallback) => {
    this._titlebarCallbacks[s] = info;
    this.forceUpdate();
  };

  _shouldShowTitlebar = () => {
    return (
      this.props.screen !== Screen.Camera &&
      (!this._titlebarCallbacks[this.props.screen] ||
        !this._titlebarCallbacks[this.props.screen].shouldShowTitlebar ||
        this._titlebarCallbacks[this.props.screen].shouldShowTitlebar!())
    );
  };

  _getTitlebarText = (): string => {
    if (
      !!this._titlebarCallbacks[this.props.screen] &&
      !!this._titlebarCallbacks[this.props.screen].getTitlebarText
    ) {
      return this._titlebarCallbacks[this.props.screen].getTitlebarText!();
    } else {
      switch (this.props.screen) {
        case Screen.Login:
          return "";
        case Screen.LocationPermission:
          return i18n.t("locationPermissions:titlebarText");
        case Screen.CameraPermission:
          return i18n.t("cameraPermissions:titlebarText");
      }
      return "";
    }
  };

  _createNotificationListeners = async () => {
    this._notificationListener = firebase
      .notifications()
      .onNotification(notification => {
        if (this.state.appState.match(/inactive|background/)) {
          const { body, title } = notification;

          this._showAlert(title, body, notification.data.localIndex);
        }
      });

    this._notificationOpenedListener = firebase
      .notifications()
      .onNotificationOpened((notificationOpen: NotificationOpen) => {
        if (notificationOpen.notification.data) {
          const patientId = notificationOpen.notification.data.localIndex;
          if (this.props.screen !== "LOGIN" && patientId) {
            this.props.dispatch(viewDetails(parseInt(patientId)));
          }
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
    if (!!this._titlebarCallbacks[this.props.screen]) {
      this._titlebarCallbacks[this.props.screen].onBack();
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

  _getScreen = () => {
    switch (this.props.screen) {
      case Screen.Login:
        return <Login />;
      case Screen.Patients:
        return <Patients setupTitlebarInfo={this._setupTitlebarInfo} />;
      case Screen.PatientDetails:
        return (
          <PatientDetails
            id={this.props.currentPatient}
            setupTitlebarInfo={this._setupTitlebarInfo}
          />
        );
      case Screen.Camera:
        return <PhotoCapture id={this.props.currentPatient} />;
      case Screen.LocationPermission:
        return <LocationPermissionRequired />;
      case Screen.CameraPermission:
        return <CameraPermissionRequired />;
      case Screen.AddPatient:
        return (
          <Details
            id={this.props.currentPatient}
            setupTitlebarInfo={this._setupTitlebarInfo}
            editable={true}
            editModeEnabled={true}
          />
        );
    }
  };

  render() {
    return (
      <Fragment>
        {this._shouldShowTitlebar() && (
          <TitleBar
            onBack={this._handleBackPress}
            titlebarText={this._getTitlebarText()}
          />
        )}
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
