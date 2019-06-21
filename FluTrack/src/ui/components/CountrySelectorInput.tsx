// Copyright (c) 2019 by Audere
//
// Use of this source code is governed by an MIT-style license that
// can be found in the LICENSE file distributed with this file.

import React from "react";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { WithNamespaces, withNamespaces } from "react-i18next";
import CountryModal from "./CountryModal";

interface Props {
  country?: string;
  placeholder: string;
  onCountryChange(country?: string): void;
}

class CountrySelectorInput extends React.Component<Props & WithNamespaces> {
  state = {
    open: false,
  };

  render() {
    const { t } = this.props;
    return (
      <View style={styles.container}>
        <TouchableOpacity
          style={styles.textContainer}
          onPress={() => this.setState({ open: true })}
        >
          {this.props.country != null ? (
            <Text style={styles.text}>{t(this.props.country)}</Text>
          ) : (
            <Text style={styles.text}>{this.props.placeholder}</Text>
          )}
        </TouchableOpacity>
        <CountryModal
          country={!!this.props.country ? this.props.country : "United States"}
          visible={this.state.open}
          onDismiss={(country: string) => {
            this.setState({ open: false });
            this.props.onCountryChange(country);
          }}
        />
      </View>
    );
  }
}

const styles = StyleSheet.create({
  container: {
    marginHorizontal: 30,
    marginVertical: 20,
  },
  textContainer: {
    alignSelf: "stretch",
    borderBottomColor: "#bbb",
    borderBottomWidth: StyleSheet.hairlineWidth,
    height: 30,
  },
  text: {
    color: "#007AFF",
    fontFamily: "OpenSans-Regular",
    fontSize: 17,
    paddingHorizontal: 16,
    letterSpacing: -0.41,
    lineHeight: 22,
  },
});

export default withNamespaces("countries")<Props>(CountrySelectorInput);
