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

interface Props {
  dispatchOnNext?: () => Action;
  label?: string;
  navigation: NavigationScreenProp<any, any>;
  namespace: string;
  next?: string;
  validate?(): boolean;
  dispatch(action: Action): void;
  surveyGetNextFn?(): Promise<string>;
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
      surveyGetNextFn,
      validate,
    } = this.props;
    if (!validate || validate()) {
      if (!!surveyGetNextFn) {
        navigation.push(await surveyGetNextFn());
      } else {
        next && navigation.push(next);
      }
      dispatchOnNext && dispatch(dispatchOnNext());
    }
  };

  render() {
    const { label, namespace, t } = this.props;

    return (
      <Button
        enabled={true}
        label={label ? t(namespace + ":" + label) : t("common:button:continue")}
        primary={true}
        onPress={this._onNext}
      />
    );
  }
}

export default connect()(withNavigation(withNamespaces()(ContinueButton)));
