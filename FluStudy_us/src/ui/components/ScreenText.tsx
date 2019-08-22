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
  label: string | string[];
  namespace: string;
  style?: StyleProp<TextStyle>;
}

function getScopedLabel(label: string, namespace: string): string {
  return label.includes(":") ? label : namespace + ":" + label;
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
    const allTheLabels = label instanceof Array ? label : [label];
    const allTheLabelText = allTheLabels.map(l =>
      t(getScopedLabel(l, namespace))
    );
    return (
      <Text
        bold={bold}
        center={center}
        content={allTheLabelText.join(" ")}
        italic={italic}
        style={[
          {
            alignSelf: "stretch",
            marginBottom: GUTTER,
          },
          style,
        ]}
      />
    );
  }
}

export default withNamespaces()(ScreenText);
