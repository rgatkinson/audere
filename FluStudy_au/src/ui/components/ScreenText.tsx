// Copyright (c) 2019 by Audere
//
// Use of this source code is governed by an MIT-style license that
// can be found in the LICENSE file distributed with this file.

import React from "react";
import { WithNamespaces, withNamespaces } from "react-i18next";
import Text from "./Text";
import { GUTTER } from "../styles";

interface Props {
  center?: boolean;
  label: string;
  namespace: string;
  italic?: boolean;
}

class ScreenText extends React.Component<Props & WithNamespaces> {
  render() {
    const { center, italic, namespace, label, t } = this.props;
    return (
      <Text
        center={center}
        content={t(namespace + ":" + label)}
        italic={italic}
        style={{
          alignSelf: "stretch",
          marginBottom: GUTTER,
          marginHorizontal: GUTTER,
        }}
      />
    );
  }
}

export default withNamespaces()(ScreenText);
