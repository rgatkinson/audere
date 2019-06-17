// Copyright (c) 2019 by Audere
//
// Use of this source code is governed by an MIT-style license that
// can be found in the LICENSE file distributed with this file.

import React from "react";
import { WithNamespaces, withNamespaces } from "react-i18next";
import { withNavigation, NavigationScreenProp } from "react-navigation";
import Button from "./Button";
import { ActivityIndicator } from "react-native";
import { GUTTER } from "../styles";

interface Props {
  hasPendingFn(): boolean;
  label?: string;
  navigation: NavigationScreenProp<any, any>;
  namespace: string;
  next?: string;
}

interface State {
  showLoading: boolean;
}

class PendingButton extends React.Component<Props & WithNamespaces, State> {
  constructor(props: Props & WithNamespaces) {
    super(props);
    this.state = { showLoading: false };
  }

  _onNext = async () => {
    const { hasPendingFn, navigation, next } = this.props;

    if (await !hasPendingFn()) {
      next && navigation.push(next);
    } else {
      this.setState({ showLoading: true });
      setTimeout(() => {
        this.setState({ showLoading: false });
      }, 1000);
    }
  };

  render() {
    const { label, namespace, t } = this.props;
    const { showLoading } = this.state;

    if (showLoading) {
      return (
        <ActivityIndicator
          size="large"
          animating={true}
          style={{ marginBottom: GUTTER * 2 }}
        />
      );
    }

    return (
      <Button
        enabled={true}
        label={label ? t(namespace + ":" + label) : t("common:button:tryAgain")}
        primary={true}
        onPress={this._onNext}
      />
    );
  }
}

export default withNavigation(withNamespaces()(PendingButton));
