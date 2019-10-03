// Copyright (c) 2019 by Audere
//
// Use of this source code is governed by an MIT-style license that
// can be found in the LICENSE file distributed with this file.

import React from "react";
import { StyleProp, ViewStyle } from "react-native";
import { WithNamespaces, withNamespaces } from "react-i18next";
import {
  withNavigation,
  NavigationScreenProp,
  StackActions,
} from "react-navigation";
import { connect } from "react-redux";
import { Action } from "../../store";
import Button from "./Button";

interface Props {
  label?: string;
  navigation: NavigationScreenProp<any, any>;
  namespace: string;
  next?: string;
  primary?: boolean;
  style?: StyleProp<ViewStyle>;
  dispatch(action: Action): void;
  dispatchOnNext?: () => Action;
  surveyGetNextFn?(): Promise<string>;
  validate?(): boolean;
  overrideValidate?: boolean;
}

class ContinueButton extends React.Component<Props & WithNamespaces> {
  shouldComponentUpdate(props: Props & WithNamespaces) {
    return (
      props.label != this.props.label || props.namespace != this.props.namespace
    );
  }

  _onNext = async () => {
    const {
      dispatch,
      dispatchOnNext,
      navigation,
      next,
      overrideValidate,
      surveyGetNextFn,
      validate,
    } = this.props;
    if (overrideValidate || !validate || validate()) {
      if (!!surveyGetNextFn) {
        navigation.dispatch(
          StackActions.push({ routeName: await surveyGetNextFn() })
        );
      } else {
        next && navigation.dispatch(StackActions.push({ routeName: next }));
      }
      dispatchOnNext && dispatch(dispatchOnNext());
    }
  };

  render() {
    const { label, namespace, primary, style, t } = this.props;
    return (
      <Button
        enabled={true}
        label={
          label
            ? label.includes(":")
              ? t(label)
              : t(namespace + ":" + label)
            : t("common:button:continue")
        }
        primary={primary === false ? primary : true}
        style={style}
        onPress={this._onNext}
      />
    );
  }
}

export default connect()(withNavigation(withNamespaces()(ContinueButton)));
