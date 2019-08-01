import React, { Fragment } from "react";
import { Alert, BackHandler, StatusBar, View } from "react-native";
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
  setFcmToken
} from "../store";
import Login from "./Login";
import Patients from "./Patients";
import Details from "./Details";
import CameraPermissionRequired from "./CameraPermissionRequired";
import LocationPermissionRequired from "./LocationPermissionRequired";
import PhotoCapture from "./PhotoCapture";
import TitleBar from "./components/TitleBar";
import AppMenu from "./AppMenu";
import { SPLASH_IMAGE, TITLEBAR_COLOR } from "./styles";

interface Props {
  currentPatient?: number;
  fcmToken?: string;
  screen: Screen;
  dispatch(action: Action): void;
}

interface BackCallbacks {
  onBack(): void;
  shouldShowBack(): boolean;
}

interface State {
  showAppMenu: boolean;
}

class AppController extends React.Component<Props, State> {
  state: State = {
    showAppMenu: false
  };
  _backHandler: any;
  _onBackCallbacks: { [s: string]: BackCallbacks } = {};
  _onTokenRefreshListener: any;
  _notificationListener: any;

  async componentDidMount() {
    this._backHandler = BackHandler.addEventListener(
      "hardwareBackPress",
      this._handleBackPress
    );

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
  }

  _showAlert(
    title: string,
    body: string,
    buttonText?: string,
    patientId?: string
  ) {
    Alert.alert(
      title,
      body,
      [
        {
          text: !!buttonText ? buttonText : i18n.t("common:ok"),
          onPress: () => {
            if (this.props.screen !== "LOGIN" && patientId) {
              this.props.dispatch(viewDetails(parseInt(patientId)));
            }
          }
        }
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

  _setupBackInfo = (
    s: Screen,
    onBack: () => void,
    shouldShowBack: () => boolean
  ) => {
    this._onBackCallbacks[s] = { onBack, shouldShowBack };
    this.forceUpdate();
  };

  _shouldShowBack = () => {
    return (
      (!!this._onBackCallbacks[this.props.screen] &&
        this._onBackCallbacks[this.props.screen].shouldShowBack()) ||
      [
        Screen.Camera,
        Screen.LocationPermission,
        Screen.CameraPermission
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
        const { body, data, title } = notification;
        this._showAlert(title, body, data.patientId);
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
      this._getToken();
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
              width: "100%"
            }
          ]}
        >
          <StatusBar
            backgroundColor="transparent"
            barStyle="dark-content"
            translucent={true}
          />
          <TitleBar
            onBack={this._shouldShowBack() && this._handleBackPress}
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
  screen: state.meta.screen
}))(AppController);
