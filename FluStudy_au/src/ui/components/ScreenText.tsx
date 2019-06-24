// Copyright (c) 2019 by Audere
//
// Use of this source code is governed by an MIT-style license that
// can be found in the LICENSE file distributed with this file.

import React from "react";
import { StyleProp, TextStyle } from "react-native";
import { WithNamespaces, withNamespaces } from "react-i18next";
import Text from "./Text";
import { GUTTER } from "../styles";

interface Props {
  bold?: boolean;
  center?: boolean;
  italic?: boolean;
  label: string;
  namespace: string;
  style?: StyleProp<TextStyle>;
}

class ScreenText extends React.Component<Props & WithNamespaces> {
  shouldComponentUpdate(props: Props & WithNamespaces) {
    return (
      props.center != this.props.center ||
      props.label != this.props.label ||
      props.namespace != this.props.namespace ||
      props.italic != this.props.italic
    );
  }

  render() {
    const { bold, center, italic, namespace, label, style, t } = this.props;
    return (
      <Text
        bold={bold}
        center={center}
        content={t(namespace + ":" + label)}
        italic={italic}
        style={[
          {
            alignSelf: "stretch",
            marginBottom: GUTTER,
            marginHorizontal: GUTTER,
          },
          style,
        ]}
      />
    );
  }
}

export default withNamespaces()(ScreenText);
