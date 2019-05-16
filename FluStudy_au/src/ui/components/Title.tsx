// Copyright (c) 2019 by Audere
//
// Use of this source code is governed by an MIT-style license that
// can be found in the LICENSE file distributed with this file.

import React from "react";
import { StyleProp, StyleSheet, View, ViewStyle } from "react-native";
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
  style?: StyleProp<ViewStyle>;
}

class Title extends React.Component<Props & WithNamespaces> {
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
        style={[styles.title, this.props.style && this.props.style]}
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
    marginTop: GUTTER / 2,
    marginBottom: GUTTER,
  },
});
