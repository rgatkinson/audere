// Copyright (c) 2019 by Audere
//
// Use of this source code is governed by an MIT-style license that
// can be found in the LICENSE file distributed with this file.

import React from "react";
import * as buildInfo from "./static/buildInfo.json";
import { WithNamespaces, withNamespaces } from "react-i18next";

export class BuildInfoPage extends React.Component<WithNamespaces> {
  render() {
    const { t } = this.props;
    return (
      <div>
        <p>{t("buildInfo.name") + buildInfo.name}</p>
        <p>{t("buildInfo.version") + buildInfo.version}</p>
        <p>{t("buildInfo.buildDate") + buildInfo.buildDate}</p>
        <p>{t("buildInfo.hash") + buildInfo.hash}</p>
      </div>
    );
  }
}

export default withNamespaces("buildInfo")(BuildInfoPage);
