// Copyright (c) 2019 by Audere
//
// Use of this source code is governed by an MIT-style license that
// can be found in the LICENSE file distributed with this file.

import React from "react";
import { StyleSheet, View } from "react-native";
import { WithNamespaces, withNamespaces } from "react-i18next";
import Divider from "./Divider";
import Text from "./Text";
import { GUTTER, SMALL_TEXT } from "../styles";

class ConsentText extends React.Component<WithNamespaces> {
  shouldComponentUpdate() {
    return false;
  }

  render() {
    const { t } = this.props;
    return (
      <View style={styles.container}>
        <Text
          center={false}
          content={t("consentFormHeader1")}
          style={styles.text}
        />
        <Divider style={styles.thinDivider} />
        <Text content={t("consentFormText")} style={styles.text} />
      </View>
    );
  }
}

export default withNamespaces("Consent")(ConsentText);

const styles = StyleSheet.create({
  container: {
    marginBottom: GUTTER,
  },
  text: {
    fontSize: SMALL_TEXT,
  },
  thinDivider: {
    alignSelf: "center",
    borderBottomColor: "#666",
    marginTop: GUTTER,
    width: "100%",
  },
});
