// Copyright (c) 2019 by Audere
//
// Use of this source code is governed by an MIT-style license that
// can be found in the LICENSE file distributed with this file.

import React from "react";
import { StyleSheet, View } from "react-native";
import { WithNamespaces, withNamespaces } from "react-i18next";
import Divider from "./Divider";
import Text from "./Text";
import { GUTTER } from "../styles";

interface Props {
  label: string;
}

class Subtitle extends React.Component<Props & WithNamespaces> {
  render() {
    const { label, t } = this.props;
    return (
      <View style={styles.container}>
        <Divider style={styles.divider} />
        <Text center={true} content={t("common:menu:" + label)} />
        <Divider style={styles.divider} />
      </View>
    );
  }
}

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: GUTTER * 2,
  },
  divider: {
    marginVertical: GUTTER / 2,
  },
});

export default withNamespaces()(Subtitle);
