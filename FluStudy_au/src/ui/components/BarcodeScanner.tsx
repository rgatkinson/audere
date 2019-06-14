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

interface Props {
  dispatch(action: Action): void;
  navigation: NavigationScreenProp<any, any>;
  next: string;
  timeoutScreen: string;
  isFocused: boolean;
}

@connect()
class BarcodeScanner extends React.Component<Props & WithNamespaces> {
  state = {
    activeScan: false,
  };

  _willFocus: any;
  _willBlur: any;
  _timer: NodeJS.Timeout | null | undefined;

  componentDidMount() {
    const { navigation } = this.props;
    this._willFocus = navigation.addListener("willFocus", () =>
      this._setTimer()
    );
    this._willBlur = navigation.addListener("willBlur", () =>
      this._clearTimer()
    );
  }

  componentWillUnmount() {
    this._willFocus.remove();
    this._willBlur.remove();
  }

  _setTimer = () => {
    const { navigation, timeoutScreen } = this.props;
    this.setState({ activeScan: false });
    // Timeout after 30 seconds
    this._clearTimer();
    this._timer = setTimeout(() => {
      if (navigation.isFocused()) {
        navigation.push(timeoutScreen);
      }
    }, 30000);
  };

  _clearTimer() {
    if (this._timer != null) {
      clearTimeout(this._timer);
      this._timer = null;
    }
  }

  _onBarCodeScanned = async ({ type, data }: { type: any; data: string }) => {
    const { dispatch, navigation, next, t } = this.props;
    const barcode = data.toLowerCase();

    if (!this.state.activeScan) {
      this.setState({ activeScan: true });
      if (!validBarcodeShape(barcode)) {
        dispatch(
          appendInvalidBarcode({
            sample_type: type,
            code: barcode,
          })
        );
        invalidBarcodeShapeAlert(barcode, this._setTimer);
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
          <Text
            style={[styles.overlayText, styles.instructionsText]}
            content={t("instructions")}
          />
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
