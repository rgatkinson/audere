// Copyright (c) 2019 by Audere
//
// Use of this source code is governed by an MIT-style license that
// can be found in the LICENSE file distributed with this file.

import React from "react";
import { WithNamespaces, withNamespaces } from "react-i18next";
import { withNavigation, NavigationScreenProp } from "react-navigation";
import Button from "./Button";

interface Props {
  navigation: NavigationScreenProp<any, any>;
  next?: string;
}

class ContinueButton extends React.Component<Props & WithNamespaces> {
  _onNext = () => {
    const { navigation, next } = this.props;
    next && navigation.push(next);
  };

  render() {
    const { t } = this.props;
    return (
      <Button
        enabled={true}
        label={t("common:button:continue")}
        primary={true}
        onPress={this._onNext}
      />
    );
  }
}

export default withNavigation(withNamespaces()(ContinueButton));
