// Copyright (c) 2019 by Audere
//
// Use of this source code is governed by an MIT-style license that
// can be found in the LICENSE file distributed with this file.

import React from "react";
import { WithNamespaces, withNamespaces } from "react-i18next";
import { withNavigation, NavigationScreenProp } from "react-navigation";
import { connect } from "react-redux";
import { Action } from "../../store";
import Button from "./Button";
import { Alert } from "react-native";

interface Props {
  label?: string;
  navigation: NavigationScreenProp<any, any>;
  namespace: string;
  next?: string;
  primary?: boolean;
  alert?: AlertConfig;
  dispatch(action: Action): void;
  dispatchOnNext?: () => Action;
  surveyGetNextFn?(): Promise<string>;
  validate?(): boolean;
}

interface AlertButtonConfig {
  text: string;
  next?: string;
}

interface AlertConfig {
  title: string;
  subtitle?: string;
  buttons: AlertButtonConfig[];
}

class ContinueButton extends React.Component<Props & WithNamespaces> {
  shouldComponentUpdate(props: Props & WithNamespaces) {
    return (
      props.label != this.props.label || props.namespace != this.props.namespace
    );
  }

  _onNext = async () => {
    const {
      alert,
      dispatch,
      dispatchOnNext,
      namespace,
      navigation,
      next,
      surveyGetNextFn,
      t,
      validate,
    } = this.props;
    if (!validate || validate()) {
      if (!!surveyGetNextFn) {
        navigation.push(await surveyGetNextFn());
      } else if (!!alert) {
        const buttons = alert.buttons.map(item => {
          return {
            text: t(namespace + ":" + item.text),
            onPress: () => {
              if (!!item.next) navigation.push(item.next);
            },
          };
        });
        Alert.alert(
          t(namespace + ":" + alert.title),
          !!alert.subtitle ? t(namespace + ":" + alert.subtitle) : "",
          buttons
        );
      } else {
        next && navigation.push(next);
      }
      dispatchOnNext && dispatch(dispatchOnNext());
    }
  };

  render() {
    const { label, namespace, primary, t } = this.props;
    return (
      <Button
        enabled={true}
        label={label ? t(namespace + ":" + label) : t("common:button:continue")}
        primary={primary === false ? primary : true}
        onPress={this._onNext}
      />
    );
  }
}

export default connect()(withNavigation(withNamespaces()(ContinueButton)));
