// Copyright (c) 2019 by Audere
//
// Use of this source code is governed by an MIT-style license that
// can be found in the LICENSE file distributed with this file.

import React from "react";
import { Dimensions, StyleSheet, Text, View } from "react-native";
import { WithNamespaces, withNamespaces } from "react-i18next";
import Modal from "./Modal";
import { Address } from "../../store";
import { GUTTER, LARGE_TEXT, REGULAR_TEXT, SYSTEM_FONT } from "../styles";

interface Props {
  address: Address | null;
  visible: boolean;
  title?: string;
  subTitle?: string;
  onDismiss(): void;
  onSubmit(): void;
}

class AddressNotFoundModal extends React.Component<Props & WithNamespaces> {
  render() {
    if (!this.props.visible || this.props.address === null) {
      return <View />;
    }
    const { t } = this.props;
    const { width } = Dimensions.get("window");
    const { address, city, state, zipcode } = this.props.address;

    return (
      <Modal
        height={260}
        width={width * 0.9}
        dismissText={t("dismissText")}
        submitText={t("submitText")}
        visible={this.props.visible}
        onDismiss={() => this.props.onDismiss()}
        onSubmit={() => this.props.onSubmit()}
      >
        <View style={styles.container}>
          <Text style={styles.title}>
            {this.props.title || t("addressNotFound")}
          </Text>
          <Text style={styles.subTitle}>
            {this.props.subTitle || t("addressConfirm")}
          </Text>
          <View style={styles.addressContainer}>
            <Text style={styles.address}>{address}</Text>
            <Text style={styles.address}>{`${city}, ${state} ${zipcode}`}</Text>
          </View>
        </View>
      </Modal>
    );
  }
}

const styles = StyleSheet.create({
  addressContainer: {
    marginLeft: GUTTER * 2,
    marginTop: GUTTER / 2,
  },
  container: {
    display: "flex",
    flexDirection: "column",
    padding: GUTTER,
    fontWeight: "bold",
  },
  address: {
    fontSize: LARGE_TEXT,
  },
  subTitle: {
    fontFamily: SYSTEM_FONT,
    fontSize: REGULAR_TEXT,
    fontStyle: "italic",
    paddingLeft: GUTTER,
  },
  title: {
    alignSelf: "center",
    paddingBottom: GUTTER,
    fontFamily: SYSTEM_FONT,
    fontSize: LARGE_TEXT,
    fontWeight: "bold",
  },
});

export default withNamespaces("addressNotFoundModal")(AddressNotFoundModal);
