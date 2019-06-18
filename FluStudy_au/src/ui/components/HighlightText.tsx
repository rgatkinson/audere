// Copyright (c) 2019 by Audere
//
// Use of this source code is governed by an MIT-style license that
// can be found in the LICENSE file distributed with this file.

import React from "react";
import { StyleSheet, View } from "react-native";
import { WithNamespaces, withNamespaces } from "react-i18next";
import { GUTTER } from "../styles";
import Text from "./Text";

interface Props {
  center?: boolean;
  color: string;
  label: string;
  namespace: string;
}

class HighlightText extends React.Component<WithNamespaces & Props> {
  render() {
    const { center, color, label, namespace, t } = this.props;
    return (
      <View
        style={[
          styles.container,
          { borderColor: color, backgroundColor: color },
        ]}
      >
        <Text center={center} content={t(namespace + ":" + label)} />
      </View>
    );
  }
}

export default withNamespaces()(HighlightText);

const styles = StyleSheet.create({
  container: {
    borderRadius: 20,
    borderWidth: 1,
    marginVertical: GUTTER,
    padding: GUTTER,
  },
});
