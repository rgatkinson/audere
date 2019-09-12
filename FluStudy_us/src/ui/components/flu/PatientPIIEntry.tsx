// Copyright (c) 2019 by Audere
//
// Use of this source code is governed by an MIT-style license that
// can be found in the LICENSE file distributed with this file.

import React from "react";
import { KeyboardAvoidingView, StyleSheet, View } from "react-native";
import { WithNamespaces, withNamespaces } from "react-i18next";
import { withNavigation, NavigationScreenProp } from "react-navigation";
import { connect } from "react-redux";
import { Action, StoreState } from "../../../store";
import { customRef } from "../CustomRef";
import { KEYBOARD_BEHAVIOR } from "../../styles";
import AddressInput from "../AddressInput";

interface Props {
  dispatch(action: Action): void;
  address: any;
  navigation: NavigationScreenProp<any, any>;
}

interface State {
  address: any;
}

class PatientPIIEntry extends React.Component<Props & WithNamespaces, State> {
  constructor(props: Props & WithNamespaces) {
    super(props);
    this.state = {
      address: !!props.address ? props.address.firstName : null,
    };
  }

  shouldComponentUpdate(props: Props & WithNamespaces, state: State) {
    return props.address != this.props.address || state != this.state;
  }

  _onAddressChange = (address: any) => {
    this.setState({ address });
  };

  _onAddressSubmit = () => {
    //TBD: setPatientPII(this.state.address);
  };

  render() {
    return (
      <KeyboardAvoidingView behavior={KEYBOARD_BEHAVIOR} enabled>
        <AddressInput
          autoFocus={true}
          value={this.state.address}
          shouldValidate={true}
          onChange={this._onAddressChange}
          onSubmitEditing={this._onAddressSubmit}
        />
      </KeyboardAvoidingView>
    );
  }
}

export default connect((state: StoreState) => ({
  //TBD: address: state.survey.patientPII.address,
}))(
  withNamespaces("patientPIIEntry")(withNavigation(customRef(PatientPIIEntry)))
);
