// Copyright (c) 2019 by Audere
//
// Use of this source code is governed by an MIT-style license that
// can be found in the LICENSE file distributed with this file.

import React from "react";
import { StyleSheet, View } from "react-native";
import { WithNamespaces, withNamespaces } from "react-i18next";
import Text from "./Text";
import {
  EXTRA_LARGE_TEXT,
  FONT_NORMAL,
  GUTTER,
  PRIMARY_COLOR,
} from "../styles";

interface Props {
  label?: string;
  namespace?: string;
}

class Title extends React.Component<Props & WithNamespaces> {
  shouldComponentUpdate(props: Props & WithNamespaces) {
    return (
      props.label != this.props.label || props.namespace != this.props.namespace
    );
  }

  _getContent = () => {
    const { label, namespace, t } = this.props;
    if (namespace != null) {
      return t(namespace + ":title");
    }
    return label;
  };

  render() {
    return (
      <Text
        center={true}
        content={this._getContent()}
        extraBold={true}
        style={styles.title}
      />
    );
  }
}

export default withNamespaces()(Title);

const styles = StyleSheet.create({
  title: {
    color: PRIMARY_COLOR,
    fontFamily: FONT_NORMAL,
    fontSize: EXTRA_LARGE_TEXT,
    lineHeight: 30,
    marginTop: GUTTER / 2,
    marginBottom: GUTTER,
  },
});
