// Copyright (c) 2019 by Audere
//
// Use of this source code is governed by an MIT-style license that
// can be found in the LICENSE file distributed with this file.

import React from "react";
import { WithNamespaces, withNamespaces } from "react-i18next";
import { withNavigation, NavigationScreenProp } from "react-navigation";
import { connect } from "react-redux";
import { Action, StoreState } from "../../store";

import Button from "./Button";

interface Props {
  dispatchOnNext?: () => Action;
  label?: string;
  navigation: NavigationScreenProp<any, any>;
  namespace: string;
  next?: string;
  dispatch(action: Action): void;
}

@connect()
class ContinueButton extends React.Component<Props & WithNamespaces> {
  _onNext = () => {
    const { dispatch, dispatchOnNext, navigation, next } = this.props;
    dispatchOnNext && dispatch(dispatchOnNext());
    next && navigation.push(next);
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

export default withNavigation(withNamespaces()(ContinueButton));