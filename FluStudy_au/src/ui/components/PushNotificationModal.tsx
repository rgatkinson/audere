// Copyright (c) 2019 by Audere
//
// Use of this source code is governed by an MIT-style license that
// can be found in the LICENSE file distributed with this file.

import React from "react";
import { Dimensions } from "react-native";
import { WithNamespaces, withNamespaces } from "react-i18next";
import Modal from "./Modal";

interface Props {
  visible: boolean;
  onDismiss(): void;
  onSubmit(): void;
}

class PushNotificationModal extends React.Component<Props & WithNamespaces> {
  render() {
    const { t } = this.props;
    return (
      <Modal
        height={175}
        width={Dimensions.get("window").width * 0.7}
        visible={this.props.visible}
        dismissText={t("common:button:no")}
        submitText={t("common:button:yes")}
        title={t("pushNotificationTitle")}
        body={t("pushNotificationBody")}
        onDismiss={this.props.onDismiss}
        onSubmit={this.props.onSubmit}
      />
    );
  }
}

export default withNamespaces("pushNotificationModal")(PushNotificationModal);
