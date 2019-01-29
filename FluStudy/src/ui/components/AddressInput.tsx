import React from "react";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { Address } from "../../store";
import { WithNamespaces, withNamespaces } from "react-i18next";
import KeyboardListener from "react-native-keyboard-listener";
import NumberInput from "./NumberInput";
import StateModal from "./StateModal";
import TextInput from "./TextInput";

interface Props {
  value?: Address | null;
  onChange(value: Address): void;
  onDone(): void;
}

interface State {
  keyboardOpen: boolean;
  stateOpen: boolean;
}

class AddressInput extends React.Component<Props & WithNamespaces> {
  address = React.createRef<TextInput>();
  city = React.createRef<TextInput>();
  stateProvince = React.createRef<TextInput>();
  zipcode = React.createRef<NumberInput>();

  state = {
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
        <TextInput
          autoCapitalize="words"
          autoCorrect={false}
          autoFocus={true}
          placeholder={
            t("streetAddress") + (this.state.keyboardOpen ? "" : t("required"))
          }
          placeholderTextColor={this.state.keyboardOpen ? undefined : "red"}
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
          placeholderTextColor={this.state.keyboardOpen ? undefined : "red"}
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
            this.zipcode.current!.focus();
          }}
        />
        <View style={{ flexDirection: "row" }}>
          <TouchableOpacity
            style={styles.pickerContainer}
            onPress={() => this.setState({ stateOpen: true })}
          >
            <Text style={styles.text}>
              {this.props.value && this.props.value.state
                ? this.props.value.state
                : t("state")}
            </Text>
          </TouchableOpacity>
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
              this.zipcode.current!.focus();
            }}
          />
          <NumberInput
            placeholder={
              t("zipcode") + (this.state.keyboardOpen ? "" : t("required"))
            }
            placeholderTextColor={this.state.keyboardOpen ? undefined : "red"}
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
