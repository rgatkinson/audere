// Copyright (c) 2019 by Audere
//
// Use of this source code is governed by an MIT-style license that
// can be found in the LICENSE file distributed with this file.

import React, { Fragment } from "react";
import { Alert, StyleSheet, View } from "react-native";
import { WithNamespaces, withNamespaces } from "react-i18next";
import {
  withNavigation,
  NavigationScreenProp,
  StackActions,
} from "react-navigation";
import { connect } from "react-redux";
import { SampleInfo } from "audere-lib/chillsProtocol";
import {
  appendInvalidBarcode,
  setKitBarcode,
  Action,
  StoreState,
} from "../../../store";
import { customRef } from "../CustomRef";
import { GUTTER } from "../../styles";
import NumberInput from "../NumberInput";
import {
  invalidBarcodeShapeAlert,
  validBarcodeShape,
} from "../../../util/barcodeVerification";
import { maxAttempts } from "../../../resources/BarCodeConfig";

interface Props {
  dispatch(action: Action): void;
  errorScreen: string;
  invalidBarcodes: SampleInfo[];
  kitBarcode: SampleInfo;
  navigation: NavigationScreenProp<any, any>;
}

interface State {
  barcode1: string | null;
  barcode2: string | null;
}

class BarcodeEntry extends React.Component<Props & WithNamespaces, State> {
  constructor(props: Props & WithNamespaces) {
    super(props);
    this.state = {
      barcode1: !!props.kitBarcode ? props.kitBarcode.code.toLowerCase() : null,
      barcode2: !!props.kitBarcode ? props.kitBarcode.code.toLowerCase() : null,
    };
  }

  shouldComponentUpdate(props: Props & WithNamespaces, state: State) {
    return props.kitBarcode != this.props.kitBarcode || state != this.state;
  }

  confirmInput = React.createRef<NumberInput>();

  _matchingBarcodes = () => {
    return (
      this.state.barcode1 != null &&
      this.state.barcode2 != null &&
      this.state.barcode1.trim() === this.state.barcode2.trim()
    );
  };

  _onBarcodeOneChange = (barcode1: string) => {
    this.setState({ barcode1: barcode1.toLowerCase() });
  };

  _onBarcodeTwoChange = (barcode2: string) => {
    this.setState({ barcode2: barcode2.toLowerCase() });
  };

  _onBarcodeOneSubmit = () => {
    this.confirmInput.current!.focus();
  };

  render() {
    const { navigation, t } = this.props;
    return (
      <Fragment>
        <View style={[styles.inputContainer, { marginBottom: GUTTER }]}>
          <NumberInput
            autoFocus={navigation.isFocused()}
            placeholder={t("placeholder")}
            returnKeyType="done"
            style={styles.textInput}
            value={this.state.barcode1}
            onChangeText={this._onBarcodeOneChange}
            onSubmitEditing={this._onBarcodeOneSubmit}
          />
        </View>
        <View style={styles.inputContainer}>
          <NumberInput
            placeholder={t("secondPlaceholder")}
            ref={this.confirmInput}
            returnKeyType="done"
            style={styles.textInput}
            value={this.state.barcode2}
            onChangeText={this._onBarcodeTwoChange}
          />
        </View>
      </Fragment>
    );
  }

  validate() {
    const { errorScreen, invalidBarcodes, t } = this.props;
    const { barcode1 } = this.state;
    if (barcode1 == null) {
      Alert.alert("", t("barcodeRequired"), [
        { text: t("common:button:ok"), onPress: () => {} },
      ]);
    } else if (!this._matchingBarcodes()) {
      Alert.alert("", t("dontMatch"), [
        { text: t("common:button:ok"), onPress: () => {} },
      ]);
    } else if (!validBarcodeShape(barcode1)) {
      const priorUnverifiedAttempts = !!invalidBarcodes
        ? invalidBarcodes.length
        : 0;
      this.props.dispatch(
        appendInvalidBarcode({
          sample_type: "manualEntry",
          code: barcode1!.trim(),
        })
      );
      if (priorUnverifiedAttempts > maxAttempts) {
        this.props.navigation.dispatch(
          StackActions.push({ routeName: errorScreen })
        );
      } else {
        invalidBarcodeShapeAlert(barcode1);
      }
    } else {
      this.props.dispatch(
        setKitBarcode({
          sample_type: "manualEntry",
          code: this.state.barcode1!.trim(),
        })
      );
      return true;
    }
    return false;
  }
}

export default connect((state: StoreState) => ({
  invalidBarcodes: state.survey.invalidBarcodes,
  kitBarcode: state.survey.kitBarcode,
}))(withNamespaces("barcode")(withNavigation(customRef(BarcodeEntry))));

const styles = StyleSheet.create({
  inputContainer: {
    alignSelf: "stretch",
    flexDirection: "row",
    marginHorizontal: GUTTER,
  },
  textInput: {
    flex: 1,
  },
});
