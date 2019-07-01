// Copyright (c) 2019 by Audere
//
// Use of this source code is governed by an MIT-style license that
// can be found in the LICENSE file distributed with this file.

import React from "react";
import { connect } from "react-redux";
import { WithNamespaces, withNamespaces } from "react-i18next";
import { withNavigation, NavigationScreenProp } from "react-navigation";
import { Permissions } from "expo";
import { Action, StoreState, setCameraSettingsGrantedPage } from "../../store/";

import Button from "./Button";

interface Props {
  navigation: NavigationScreenProp<any, any>;
  grantedNext: string;
  deniedNext: string;
  dispatch(action: Action): void;
}

class CameraPermissionContinueButton extends React.Component<
  Props & WithNamespaces
> {
  shouldComponentUpdate(props: Props & WithNamespaces) {
    return false;
  }

  _onNext = async () => {
    const { deniedNext, dispatch, grantedNext, navigation } = this.props;
    const { status } = await Permissions.askAsync(Permissions.CAMERA);
    if (status === "granted") {
      navigation.push(grantedNext);
    } else {
      dispatch(setCameraSettingsGrantedPage(grantedNext));
      navigation.push(deniedNext);
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

export default connect((state: StoreState) => ({}))(
  withNavigation(withNamespaces()(CameraPermissionContinueButton))
);
