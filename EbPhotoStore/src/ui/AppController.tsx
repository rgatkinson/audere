import React, { Fragment } from "react";
import {
  BackHandler,
  Image,
  ImageBackground,
  StatusBar,
  View
} from "react-native";
import { connect } from "react-redux";
import {
  logout,
  viewPatients,
  viewDetails,
  Action,
  Screen,
  StoreState
} from "../store";
import Login from "./Login";
import Patients from "./Patients";
import Details from "./Details";
import CameraPermissionRequired from "./CameraPermissionRequired";
import LocationPermissionRequired from "./LocationPermissionRequired";
import PhotoCapture from "./PhotoCapture";
import TitleBar from "./components/TitleBar";
import { SPLASH_IMAGE } from "./styles";

interface Props {
  currentPatient?: number;
  screen: Screen;
  dispatch(action: Action): void;
}

interface BackCallbacks {
  onBack(): void;
  shouldShowBack(): boolean;
}

class AppController extends React.Component<Props> {
  _backHandler: any;
  _onBackCallbacks: { [s: string]: BackCallbacks } = {};

  componentDidMount() {
    this._backHandler = BackHandler.addEventListener(
      "hardwareBackPress",
      this._handleBackPress
    );
  }

  componentWillUnmount() {
    if (this._backHandler != null) {
      this._backHandler.remove();
    }
  }

  shouldComponentUpdate(props: Props) {
    return props.screen !== this.props.screen;
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
        <ImageBackground
          source={SPLASH_IMAGE}
          style={[{ alignSelf: "stretch", width: "100%" }]}
        >
          <StatusBar
            backgroundColor="transparent"
            barStyle="light-content"
            translucent={true}
          />
          <TitleBar onBack={this._shouldShowBack() && this._handleBackPress} />
        </ImageBackground>
        {this._getScreen()}
      </Fragment>
    );
  }
}
export default connect((state: StoreState) => ({
  currentPatient: state.meta.currentPatient,
  screen: state.meta.screen
}))(AppController);
