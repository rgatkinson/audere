import React from "react";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";
import CountryModal from "./CountryModal";

interface Props {
  country?: string;
  placeholder: string;
  onCountryChange(country?: string): void;
}

export default class CountrySelectorInput extends React.Component<Props> {
  state = {
    open: false,
  };

  render() {
    return (
      <View style={styles.container}>
        <TouchableOpacity
          style={styles.textContainer}
          onPress={() => this.setState({ open: true })}
        >
          {this.props.country != null ? (
            <Text style={styles.text}>{this.props.country}</Text>
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
