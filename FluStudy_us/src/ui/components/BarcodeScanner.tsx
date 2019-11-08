// Copyright (c) 2019 by Audere
//
// Use of this source code is governed by an MIT-style license that
// can be found in the LICENSE file distributed with this file.

import React from "react";
import { StyleSheet, TouchableOpacity, View } from "react-native";
import {
  NavigationScreenProp,
  withNavigationFocus,
  StackActions,
} from "react-navigation";
import { connect } from "react-redux";
import { WithNamespaces, withNamespaces } from "react-i18next";
import { Camera } from "expo-camera";
import { SampleInfo } from "audere-lib/chillsProtocol";
import {
  Action,
  StoreState,
  appendInvalidBarcode,
  setKitBarcode,
} from "../../store";
import Text from "../components/Text";
import {
  invalidBarcodeShapeAlert,
  validBarcodeShape,
} from "../../util/barcodeVerification";
import { GUTTER, PRIMARY_COLOR, SCREEN_MARGIN } from "../styles";
import { logFirebaseEvent, AppEvents } from "../../util/tracker";
import { maxAttempts } from "../../resources/BarCodeConfig";

interface Props {
  dispatch(action: Action): void;
  errorScreen: string;
  invalidBarcodes: SampleInfo[];
  navigation: NavigationScreenProp<any, any>;
  next?: string;
  surveyGetNextFn?(): Promise<string>;
  timeoutScreen: string;
  isFocused: boolean;
}

@connect((state: StoreState) => ({
  invalidBarcodes: state.survey.invalidBarcodes,
}))
class BarcodeScanner extends React.Component<Props & WithNamespaces> {
  state = {
    activeScan: false,
    showHelpText: false,
  };

  shouldComponentUpdate(nextProps: Props & WithNamespaces, nextState: any) {
    return (
      this.state.showHelpText !== nextState.showHelpText ||
      nextProps.isFocused != this.props.isFocused
    );
  }

  _didFocus: any;
  _willBlur: any;
  _timeoutTimer: NodeJS.Timeout | null | undefined;
  _helpTimer: NodeJS.Timeout | null | undefined;

  componentDidMount() {
    const { navigation } = this.props;
    this._didFocus = navigation.addListener("didFocus", this._handleDidFocus);
    this._willBlur = navigation.addListener("willBlur", this._handleWillBlur);

    // We need to manually call this here in case the component is being instantiated
    // on first run of the app, or on StackActions.replace. In other words, if the
    // screen that it's a part of isn't being pushed on to the nav stack.
    this._handleDidFocus();
  }

  componentWillUnmount() {
    this._handleWillBlur();
    this._didFocus.remove();
    this._willBlur.remove();
  }

  _handleDidFocus = () => {
    this._setTimeoutTimer();
    this._setHelpTimer();
  };

  _handleWillBlur = () => {
    this._clearTimeoutTimer();
    this._clearHelpTimer();
  };

  _setHelpTimer() {
    this.setState({ showHelpText: false });
    this._clearHelpTimer();
    this._helpTimer = global.setTimeout(() => {
      this.setState({ showHelpText: true });
    }, 8000);
  }

  _clearHelpTimer() {
    if (this._helpTimer != null) {
      clearTimeout(this._helpTimer);
      this._helpTimer = null;
    }
  }

  _setTimeoutTimer = () => {
    const { navigation, timeoutScreen } = this.props;
    this.setState({ activeScan: false });
    // Timeout after 30 seconds
    this._clearTimeoutTimer();
    this._timeoutTimer = global.setTimeout(() => {
      if (navigation.isFocused()) {
        logFirebaseEvent(AppEvents.BARCODE_TIMEOUT);
        navigation.dispatch(StackActions.push({ routeName: timeoutScreen }));
      }
    }, 30000);
  };

  _clearTimeoutTimer() {
    if (this._timeoutTimer != null) {
      clearTimeout(this._timeoutTimer);
      this._timeoutTimer = null;
    }
  }

  _onBarCodeScanned = async ({ type, data }: { type: any; data: string }) => {
    const {
      dispatch,
      errorScreen,
      invalidBarcodes,
      navigation,
      next,
      surveyGetNextFn,
      t,
    } = this.props;
    const barcode = data.toLowerCase();

    if (!this.state.activeScan) {
      this.setState({ activeScan: true });
      if (!validBarcodeShape(barcode)) {
        const priorUnverifiedAttempts = !!invalidBarcodes
          ? invalidBarcodes.length
          : 0;
        dispatch(
          appendInvalidBarcode({
            sample_type: type,
            code: barcode,
          })
        );
        if (priorUnverifiedAttempts > maxAttempts) {
          navigation.dispatch(StackActions.push({ routeName: errorScreen }));
        } else {
          invalidBarcodeShapeAlert(barcode, this._setTimeoutTimer);
        }
      } else {
        dispatch(
          setKitBarcode({
            sample_type: type,
            code: barcode,
          })
        );

        if (!!surveyGetNextFn) {
          navigation.dispatch(
            StackActions.push({ routeName: await surveyGetNextFn() })
          );
        } else {
          next && navigation.dispatch(StackActions.push({ routeName: next }));
        }
      }
    }
  };

  _onManualEntry = () => {
    this.props.navigation.dispatch(
      StackActions.push({ routeName: this.props.timeoutScreen })
    );
  };

  render() {
    const { isFocused, t } = this.props;
    if (!isFocused) {
      return null;
    }
    return (
      <View style={styles.container}>
        <Camera
          style={StyleSheet.absoluteFill}
          onBarCodeScanned={this._onBarCodeScanned}
        />
        <View style={styles.overlayContainer}>
          <View style={styles.targetBox} />
          <View style={styles.helpBox}>
            {this.state.showHelpText && (
              <Text
                style={[styles.overlayText, styles.instructionsText]}
                content={t("instructions")}
              />
            )}
          </View>
          <TouchableOpacity
            style={styles.overlay}
            onPress={this._onManualEntry}
          >
            <Text
              center={true}
              content={t("enterManually")}
              style={styles.overlayText}
            />
          </TouchableOpacity>
        </View>
      </View>
    );
  }
}

export default withNavigationFocus(
  withNamespaces("BarcodeScanner")(BarcodeScanner)
);

const styles = StyleSheet.create({
  container: {
    flex: 1,
    marginHorizontal: -SCREEN_MARGIN,
  },
  helpBox: {
    height: 200,
  },
  instructionsText: {
    paddingHorizontal: GUTTER,
    paddingTop: GUTTER * 2,
    marginBottom: GUTTER,
  },
  overlayText: {
    color: "white",
  },
  overlay: {
    alignItems: "center",
    backgroundColor: PRIMARY_COLOR,
    bottom: 0,
    height: 50,
    justifyContent: "center",
    left: 0,
    position: "absolute",
    right: 0,
  },
  overlayContainer: {
    alignItems: "center",
    backgroundColor: "transparent",
    bottom: 0,
    justifyContent: "center",
    left: 0,
    position: "absolute",
    right: 0,
    top: 0,
  },
  targetBox: {
    borderColor: "#F5A623",
    borderRadius: 2,
    borderWidth: 4,
    height: 250,
    width: 250,
  },
});
