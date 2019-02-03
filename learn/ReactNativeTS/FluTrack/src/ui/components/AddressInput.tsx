import React from "react";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { Address } from "../../store";
import { WithNamespaces, withNamespaces } from "react-i18next";
import KeyboardListener from "react-native-keyboard-listener";
import CountryModal from "./CountryModal";
import NumberInput from "./NumberInput";
import StateModal from "./StateModal";
import TextInput from "./TextInput";

interface Props {
  showLocationField?: boolean;
  value?: Address | null;
  onChange(value: Address): void;
  onDone(): void;
}

interface State {
  countryOpen: boolean;
  keyboardOpen: boolean;
  stateOpen: boolean;
}

class AddressInput extends React.Component<Props & WithNamespaces> {
  address = React.createRef<TextInput>();
  city = React.createRef<TextInput>();
  stateProvince = React.createRef<TextInput>();
  zipcode = React.createRef<NumberInput>();
  postalCode = React.createRef<TextInput>();

  _isUSAddress = (): boolean => {
    return (
      !this.props.value ||
      !this.props.value.country ||
      this.props.value.country === "United States"
    );
  };

  state = {
    countryOpen: false,
    stateOpen: false,
    keyboardOpen: true,
  };

  render() {
    const { t } = this.props;
    return (
      <View style={styles.container}>
        <KeyboardListener
          onWillShow={() => {
            this.setState({ keyboardOpen: true });
          }}
          onWillHide={() => {
            this.setState({ keyboardOpen: false });
          }}
        />
        {this.props.showLocationField && (
          <TextInput
            autoCapitalize="words"
            autoCorrect={false}
            autoFocus={true}
            placeholder={t("locationName")}
            returnKeyType="next"
            style={styles.textInput}
            value={this.props.value ? this.props.value!.location : undefined}
            onChangeText={(text: string) => {
              const address = this.props.value || {};
              address.location = text;
              this.props.onChange(address);
            }}
            onSubmitEditing={() => this.address.current!.focus()}
          />
        )}
        <TouchableOpacity
          style={styles.pickerContainer}
          onPress={() => this.setState({ countryOpen: true })}
        >
          <Text style={styles.text}>
            {this.props.value && this.props.value.country
              ? this.props.value.country
              : "United States"}
          </Text>
        </TouchableOpacity>
        <CountryModal
          country={
            this.props.value && this.props.value!.country
              ? this.props.value!.country!
              : "United States"
          }
          visible={this.state.countryOpen}
          onDismiss={(country: string) => {
            this.setState({ countryOpen: false });
            const address = this.props.value || {};
            address.country = country;
            this.props.onChange(address);
            this.address.current!.focus();
          }}
        />
        <TextInput
          autoCapitalize="words"
          autoCorrect={false}
          autoFocus={!this.props.showLocationField}
          placeholder={
            t("streetAddress") +
            (this.state.keyboardOpen || !this._isUSAddress()
              ? ""
              : t("required"))
          }
          ref={this.address}
          returnKeyType="next"
          style={styles.textInput}
          value={this.props.value ? this.props.value!.address : undefined}
          onChangeText={(text: string) => {
            const address = this.props.value || {};
            address.address = text;
            this.props.onChange(address);
          }}
          onSubmitEditing={() => this.city.current!.focus()}
        />
        <TextInput
          autoCapitalize="words"
          autoCorrect={false}
          placeholder={
            t("city") + (this.state.keyboardOpen ? "" : t("required"))
          }
          ref={this.city}
          returnKeyType="next"
          style={styles.textInput}
          value={this.props.value ? this.props.value!.city : undefined}
          onChangeText={(text: string) => {
            const address = this.props.value || {};
            address.city = text;
            this.props.onChange(address);
          }}
          onSubmitEditing={() => {
            this._isUSAddress()
              ? this.zipcode.current!.focus()
              : this.stateProvince.current!.focus();
          }}
        />
        <View style={{ flexDirection: "row" }}>
          {this._isUSAddress() ? (
            <TouchableOpacity
              style={styles.pickerContainer}
              onPress={() => this.setState({ stateOpen: true })}
            >
              <Text style={styles.text}>
                {this.props.value && this.props.value.state
                  ? this.props.value.state
                  : "WA"}
              </Text>
            </TouchableOpacity>
          ) : (
            <TextInput
              autoCapitalize="words"
              autoCorrect={false}
              placeholder={
                t("stateProvince") +
                (this.state.keyboardOpen ? "" : t("required"))
              }
              ref={this.stateProvince}
              returnKeyType="next"
              style={[{ flex: 1 }, styles.textInput]}
              value={this.props.value ? this.props.value!.state : undefined}
              onChangeText={(text: string) => {
                const address = this.props.value || {};
                address.state = text;
                this.props.onChange(address);
              }}
              onSubmitEditing={() => this.postalCode.current!.focus()}
            />
          )}
          <StateModal
            state={
              this.props.value && this.props.value!.state
                ? this.props.value!.state!
                : "WA"
            }
            visible={this.state.stateOpen}
            onDismiss={(state: string) => {
              this.setState({ stateOpen: false });
              const address = this.props.value || {};
              address.state = state;
              this.props.onChange(address);
              this._isUSAddress()
                ? this.zipcode.current!.focus()
                : this.postalCode.current!.focus();
            }}
          />
          {this._isUSAddress() ? (
            <NumberInput
              placeholder={
                t("zipcode") + (this.state.keyboardOpen ? "" : t("required"))
              }
              ref={this.zipcode}
              returnKeyType="next"
              style={[styles.zipcode, styles.textInput]}
              value={this.props.value ? this.props.value!.zipcode : undefined}
              onChangeText={(text: string) => {
                const address = this.props.value || {};
                address.zipcode = text;
                this.props.onChange(address);
              }}
              onSubmitEditing={this.props.onDone}
            />
          ) : (
            <TextInput
              autoCorrect={false}
              placeholder={
                t("postalCode") + (this.state.keyboardOpen ? "" : t("required"))
              }
              keyboardType="numbers-and-punctuation"
              ref={this.postalCode}
              returnKeyType="next"
              style={[styles.zipcode, styles.textInput]}
              value={this.props.value ? this.props.value!.zipcode : undefined}
              onChangeText={(text: string) => {
                const address = this.props.value || {};
                address.zipcode = text;
                this.props.onChange(address);
              }}
              onSubmitEditing={this.props.onDone}
            />
          )}
        </View>
      </View>
    );
  }
}

const styles = StyleSheet.create({
  container: {
    alignSelf: "stretch",
    marginVertical: 20,
    marginHorizontal: 30,
  },
  pickerContainer: {
    borderBottomColor: "#bbb",
    borderBottomWidth: StyleSheet.hairlineWidth,
    flex: 1,
    height: 44,
    justifyContent: "center",
    paddingHorizontal: 16,
  },
  text: {
    paddingTop: 3,
    color: "#007AFF",
    fontSize: 17,
    height: 30,
    letterSpacing: -0.41,
    lineHeight: 22,
  },
  textInput: {
    fontSize: 17,
    height: 44,
    letterSpacing: -0.41,
    lineHeight: 22,
    marginVertical: 0,
  },
  zipcode: {
    flex: 1,
    borderLeftColor: "#bbb",
    borderLeftWidth: StyleSheet.hairlineWidth,
  },
});

export default withNamespaces("addressInput")<Props>(AddressInput);
