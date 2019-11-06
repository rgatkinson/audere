// Copyright (c) 2019 by Audere
//
// Use of this source code is governed by an MIT-style license that
// can be found in the LICENSE file distributed with this file.

import React from "react";
import { Alert, StyleSheet, View } from "react-native";
import { WithNamespaces, withNamespaces } from "react-i18next";
import {
  withNavigation,
  NavigationScreenProp,
  StackActions,
} from "react-navigation";
import { customRef } from "./CustomRef";
import { GUTTER } from "./../styles";
import { getStore, StoreState } from "../../store";
import TextInput from "./TextInput";

interface Props {
  errorScreen: string;
  email: string;
  namespace: string;
  placeholder?: string;
  navigation: NavigationScreenProp<any, any>;
}

interface State {
  email: string | null;
}

class EmailEntry extends React.Component<Props & WithNamespaces, State> {
  constructor(props: Props & WithNamespaces) {
    super(props);
    this.state = {
      email: props.email,
    };
  }

  shouldComponentUpdate(props: Props & WithNamespaces, state: State) {
    return props.email !== this.props.email || state != this.state;
  }

  _onEmailChange = (email: string) => {
    this.setState({ email });
  };

  render() {
    const { namespace, navigation, placeholder, t } = this.props;
    return (
      <View style={[styles.inputContainer, { marginBottom: GUTTER }]}>
        <TextInput
          autoCapitalize="none"
          autoCorrect={false}
          autoFocus={navigation.isFocused()}
          keyboardType="email-address"
          placeholder={
            !!placeholder &&
            t(
              placeholder.includes(":")
                ? placeholder
                : namespace + ":" + placeholder
            )
          }
          returnKeyType="done"
          style={styles.textInput}
          value={this.state.email}
          onChangeText={this._onEmailChange}
        />
      </View>
    );
  }

  _validEmailShape(email: string): boolean {
    // Top answer in https://stackoverflow.com/questions/46155/how-to-validate-an-email-address-in-javascript
    const validationPattern = /^(([^<>()\[\]\.,;:\s@\"]+(\.[^<>()\[\]\.,;:\s@\"]+)*)|(\".+\"))@(([^<>()[\]\.,;:\s@\"]+\.)+[^<>()[\]\.,;:\s@\"]{2,})$/i;
    return !!email && validationPattern.test(email!);
  }

  validate() {
    const { errorScreen, t } = this.props;
    const { email } = this.state;
    if (!email || email.length === 0) {
      Alert.alert("", t("common:emailEntry:emailRequired"), [
        { text: t("common:button:ok"), onPress: () => {} },
      ]);
    } else if (!this._validEmailShape(email)) {
      Alert.alert("", t("common:emailEntry:emailInvalid"), [
        { text: t("common:button:ok"), onPress: () => {} },
      ]);
    } else {
      //TODO: check against connected prop for actual email address
      //this.props.navigation.dispatch(
      //  StackActions.push({ routeName: errorScreen })
      //);
      return true;
    }
    return false;
  }
}

export default withNavigation(withNamespaces()(customRef(EmailEntry)));

const styles = StyleSheet.create({
  inputContainer: {
    alignSelf: "stretch",
    flexDirection: "row",
  },
  textInput: {
    flex: 1,
  },
});

export async function getEmailConfirmationTextVariables() {
  const state: StoreState = (await getStore()).getState();
  //TBD: return correct email hint and entered email
  return {
    barcode: state.survey.kitBarcode && state.survey.kitBarcode.code,
    emailHint: "**j/*/*/*/*/*/*n@gmail.com**",
    enteredEmail: "no@one.com",
  };
}
