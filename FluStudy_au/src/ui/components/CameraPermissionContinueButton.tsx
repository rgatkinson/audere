// Copyright (c) 2019 by Audere
//
// Use of this source code is governed by an MIT-style license that
// can be found in the LICENSE file distributed with this file.

import React from "react";
import { WithNamespaces, withNamespaces } from "react-i18next";
import { withNavigation, NavigationScreenProp } from "react-navigation";
import { Camera, Permissions } from "expo";

import Button from "./Button";

interface Props {
  navigation: NavigationScreenProp<any, any>;
  grantedNext: string;
  deniedNext: string;
}

class CameraPermissionContinueButton extends React.Component<
  Props & WithNamespaces
> {
  shouldComponentUpdate(props: Props & WithNamespaces) {
    return false;
  }

  _onNext = async () => {
    const { deniedNext, grantedNext, navigation } = this.props;
    const { status } = await Permissions.askAsync(Permissions.CAMERA);
    if (status === "granted") {
      this.props.navigation.push(grantedNext);
    } else {
      this.props.navigation.push(deniedNext);
    }
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

export default withNavigation(withNamespaces()(CameraPermissionContinueButton));
