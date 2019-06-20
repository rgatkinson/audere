// Copyright (c) 2019 by Audere
//
// Use of this source code is governed by an MIT-style license that
// can be found in the LICENSE file distributed with this file.

import React from "react";
import {
  Dimensions,
  Platform,
  StyleSheet,
  TouchableOpacity,
  View,
} from "react-native";
import { NavigationScreenProp, withNavigationFocus } from "react-navigation";
import { connect } from "react-redux";
import { WithNamespaces, withNamespaces } from "react-i18next";
import { BarCodeScanner } from "expo";
import { SampleInfo } from "audere-lib/feverProtocol";
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
import { GUTTER, PRIMARY_COLOR } from "../styles";
import { tracker, AppEvents } from "../../util/tracker";
import { maxAttempts } from "../../resources/BarCodeConfig";

interface Props {
  dispatch(action: Action): void;
  errorScreen: string;
  invalidBarcodes: SampleInfo[];
  navigation: NavigationScreenProp<any, any>;
  next: string;
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
    this._didFocus = navigation.addListener("didFocus", () => {
      this._setTimeoutTimer();
      this._setHelpTimer();
    });
    this._willBlur = navigation.addListener("willBlur", () => {
      this._clearTimeoutTimer();
      this._clearHelpTimer();
    });
  }

  componentWillUnmount() {
    this._didFocus.remove();
    this._willBlur.remove();
  }

  _setHelpTimer = () => {
    this.setState({ showHelpText: false });
    this._clearHelpTimer();
    this._helpTimer = setTimeout(() => {
      this.setState({ showHelpText: true });
    }, 8000);
  };

  _clearHelpTimer = () => {
    if (this._helpTimer != null) {
      clearTimeout(this._helpTimer);
      this._helpTimer = null;
    }
  };

  _setTimeoutTimer = () => {
    const { navigation, timeoutScreen } = this.props;
    this.setState({ activeScan: false });
    // Timeout after 30 seconds
    this._clearTimeoutTimer();
    this._timeoutTimer = setTimeout(() => {
      if (navigation.isFocused()) {
        tracker.logEvent(AppEvents.BARCODE_TIMEOUT);
        navigation.push(timeoutScreen);
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
          navigation.push(errorScreen);
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
        navigation.push(next);
      }
    }
  };

  _onManualEntry = () => {
    this.props.navigation.push(this.props.timeoutScreen);
  };

  render() {
    const { isFocused, t } = this.props;
    if (!isFocused) {
      return null;
    }
    return (
      <View style={styles.container}>
        <BarCodeScanner
          style={{ flex: 1, alignSelf: "stretch" }}
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
    marginHorizontal: -GUTTER,
  },
  helpBox: {
    height: 100,
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
