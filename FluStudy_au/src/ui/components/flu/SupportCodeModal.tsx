// Copyright (c) 2019 by Audere
//
// Use of this source code is governed by an MIT-style license that
// can be found in the LICENSE file distributed with this file.

import React from "react";
import { Dimensions, KeyboardAvoidingView, View } from "react-native";
import { WithNamespaces, withNamespaces } from "react-i18next";
import { withNavigation, NavigationScreenProp } from "react-navigation";
import { connect } from "react-redux";
import {
  setSupportCode,
  toggleSupportCodeModal,
  Action,
  StoreState,
} from "../../../store";
import { ERROR_COLOR, GUTTER, KEYBOARD_BEHAVIOR } from "../../styles";
import DigitInput from "../DigitInput";
import Modal from "../Modal";
import Text from "../Text";
import { verifiedSupportCode } from "../../../util/barcodeVerification";

interface Props {
  dispatch(action: Action): void;
  navigation: NavigationScreenProp<any, any>;
  supportModalVisible: boolean;
}

class SupportCodeModal extends React.Component<Props & WithNamespaces> {

  state = {
    invalidCode: false,
    supportCode: "",
  };

  _onSupportCodeSubmit = (supportCode: string) => {
    if (verifiedSupportCode(supportCode)) {
      this.setState({ invalidCode: false });
      this.props.dispatch(setSupportCode(supportCode));
      this.props.dispatch(toggleSupportCodeModal());
      this.props.navigation.push("ManualEntry");
    } else {
      this.setState({ invalidCode: true });
    }
  };

  _onModalSubmit = () => {
    this._onSupportCodeSubmit(this.state.supportCode);
  };

  _updateSupportCode = (supportCode: string) => {
    this.setState({ supportCode });
    this._onSupportCodeSubmit(supportCode);
  };

  render() {
    const { dispatch, supportModalVisible, t } = this.props;
    const width = Dimensions.get("window").width;
    return (
      <Modal
        height={280}
        width={width * 0.8}
        title={t("supportVerification")}
        visible={supportModalVisible}
        onDismiss={() => dispatch(toggleSupportCodeModal())}
        onSubmit={this._onModalSubmit}
      >
        <KeyboardAvoidingView
          style={{ flex: 1 }}
          behavior={KEYBOARD_BEHAVIOR}
          enabled
        >
          <View style={{ justifyContent: "space-between", padding: GUTTER }}>
            <Text
              content={t("enterCode")}
              style={{ paddingBottom: GUTTER }}
            />
            <DigitInput
              digits={5}
              style={
                this.state.invalidCode ? { color: ERROR_COLOR } : undefined
              }
              onSubmitEditing={this._updateSupportCode}
            />
            <Text
              center={true}
              content={this.state.invalidCode ? t("invalidCode") : ""}
              style={{ color: ERROR_COLOR, paddingVertical: GUTTER }}
            />
          </View>
        </KeyboardAvoidingView>
      </Modal>
    );
  }
}

export default connect((state: StoreState) => ({
  supportModalVisible: state.meta.supportCodeModalVisible,
}))(withNamespaces("BarcodeSupportModal")(withNavigation(SupportCodeModal)));
