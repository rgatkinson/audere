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
import { withNavigation, NavigationScreenProp } from "react-navigation";
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
import { GUTTER } from "../styles";

interface Props {
  dispatch(action: Action): void;
  errorScreen: string;
  invalidBarcodes: SampleInfo[];
  navigation: NavigationScreenProp<any, any>;
  next: string;
  timeoutScreen: string;
}

@connect((state: StoreState) => ({
  invalidBarcodes: state.survey.invalidBarcodes,
}))
class BarcodeScanner extends React.Component<Props & WithNamespaces> {
  state = {
    activeScan: false,
  };

  constructor(props: Props & WithNamespaces) {
    super(props);
    this._setTimer = this._setTimer.bind(this);
  }

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

  _setTimer() {
    const { navigation, timeoutScreen } = this.props;
    this.setState({ activeScan: false });
    // Timeout after 30 seconds
    this._clearTimer();
    this._timer = setTimeout(() => {
      if (navigation.isFocused()) {
        navigation.push(timeoutScreen);
      }
    }, 30000);
  }

  _clearTimer() {
    if (this._timer != null) {
      clearTimeout(this._timer);
      this._timer = null;
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
        if (priorUnverifiedAttempts > 2) {
          navigation.push(errorScreen);
        } else {
          invalidBarcodeShapeAlert(barcode, this._setTimer);
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
    const { t } = this.props;
    return (
      <View style={styles.container}>
        <BarCodeScanner
          style={{ flex: 1, alignSelf: "stretch" }}
          onBarCodeScanned={this._onBarCodeScanned}
        />
        <View style={styles.overlayContainer}>
          <View style={styles.targetBox} />
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

export default withNavigation(withNamespaces("BarcodeScanner")(BarcodeScanner));

const styles = StyleSheet.create({
  container: {
    flex: 1,
    marginHorizontal: Platform.OS === "ios" ? -GUTTER : 0,
  },
  overlayText: {
    color: "white",
    textDecorationLine: "underline",
  },
  overlay: {
    alignItems: "center",
    height: 50,
    justifyContent: "center",
    marginTop: 50,
    width: 300,
  },
  overlayContainer: {
    alignItems: "center",
    backgroundColor: "transparent",
    height: Dimensions.get("window").height,
    left: -GUTTER,
    justifyContent: "center",
    position: "absolute",
    top: 0,
    width: Dimensions.get("window").width,
  },
  targetBox: {
    borderColor: "#F5A623",
    borderRadius: 2,
    borderWidth: 4,
    height: 250,
    width: 250,
  },
});
