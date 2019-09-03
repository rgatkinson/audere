// Copyright (c) 2019 by Audere
//
// Use of this source code is governed by an MIT-style license that
// can be found in the LICENSE file distributed with this file.

import React from "react";
import * as buildInfo from "./static/buildInfo.json";
import { WithNamespaces, withNamespaces } from "react-i18next";

class BuildInfoPage extends React.Component<WithNamespaces> {
  render() {
    const { t } = this.props;
    return (
      <div>
        <p>{t("name") + buildInfo.name}</p>
        <p>{t("version") + buildInfo.version}</p>
        <p>{t("buildDate") + buildInfo.buildDate}</p>
        <p>{t("hash") + buildInfo.hash}</p>
      </div>
    );
  }
}

export default withNamespaces("buildInfo")(BuildInfoPage);
