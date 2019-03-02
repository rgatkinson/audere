import React from "react";
import { StyleSheet, TouchableOpacity, View } from "react-native";
import { Address } from "../../store";
import { WithNamespaces, withNamespaces } from "react-i18next";
import KeyboardListener from "react-native-keyboard-listener";
import NumberInput from "./NumberInput";
import StateModal from "./StateModal";
import Text from "./Text";
import TextInput from "./TextInput";
import {
  BORDER_COLOR,
  ERROR_COLOR,
  GUTTER,
  INPUT_HEIGHT,
  LINK_COLOR,
} from "../styles";

interface Props {
  value?: Address | null;
  onChange(value: Address): void;
}

interface State {
  keyboardOpen: boolean;
  stateOpen: boolean;
  focusZip: boolean;
}

class AddressInput extends React.Component<Props & WithNamespaces> {
  lastName = React.createRef<TextInput>();
  address = React.createRef<TextInput>();
  address2 = React.createRef<TextInput>();
  city = React.createRef<TextInput>();
  stateProvince = React.createRef<TextInput>();
  zipcode = React.createRef<NumberInput>();

  state = {
    stateOpen: false,
    keyboardOpen: true,
    focusZip: false,
  };

  componentWillUpdate(nextProps: any, nextState: any) {
    if (this.state.focusZip) {
      this.zipcode.current!.focus();
    }
  }

  removeZipFocus = (): void => {
    if (this.state.focusZip) {
      this.setState({ focusZip: false });
    }
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
        <View style={{ flexDirection: "row" }}>
          <TextInput
            autoCapitalize="words"
            autoCorrect={false}
            autoFocus={true}
            onFocus={this.removeZipFocus}
            placeholder={
              t("firstName") + (this.state.keyboardOpen ? "" : t("required"))
            }
            placeholderTextColor={
              this.state.keyboardOpen ? undefined : ERROR_COLOR
            }
            returnKeyType="next"
            style={styles.firstName}
            value={this.props.value ? this.props.value!.firstName : undefined}
            onChangeText={(text: string) => {
              const address = this.props.value || {};
              address.firstName = text;
              this.props.onChange(address);
            }}
            onSubmitEditing={() => this.lastName.current!.focus()}
          />
          <TextInput
            autoCapitalize="words"
            autoCorrect={false}
            autoFocus={false}
            placeholder={
              t("lastName") + (this.state.keyboardOpen ? "" : t("required"))
            }
            ref={this.lastName}
            onFocus={this.removeZipFocus}
            placeholderTextColor={
              this.state.keyboardOpen ? undefined : ERROR_COLOR
            }
            returnKeyType="next"
            style={styles.inputRowRight}
            value={this.props.value ? this.props.value!.lastName : undefined}
            onChangeText={(text: string) => {
              const address = this.props.value || {};
              address.lastName = text;
              this.props.onChange(address);
            }}
            onSubmitEditing={() => this.address.current!.focus()}
          />
        </View>
        <TextInput
          autoCapitalize="words"
          autoCorrect={false}
          autoFocus={false}
          onFocus={this.removeZipFocus}
          placeholder={
            t("streetAddress") + (this.state.keyboardOpen ? "" : t("required"))
          }
          placeholderTextColor={
            this.state.keyboardOpen ? undefined : ERROR_COLOR
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
          onSubmitEditing={() => this.address2.current!.focus()}
        />
        <TextInput
          autoCapitalize="words"
          autoCorrect={false}
          autoFocus={false}
          onFocus={this.removeZipFocus}
          placeholder={t("streetAddress")}
          ref={this.address2}
          returnKeyType="next"
          style={styles.textInput}
          value={this.props.value ? this.props.value!.address2 : undefined}
          onChangeText={(text: string) => {
            const address = this.props.value || {};
            address.address2 = text;
            this.props.onChange(address);
          }}
          onSubmitEditing={() => this.city.current!.focus()}
        />
        <TextInput
          autoCapitalize="words"
          autoCorrect={false}
          onFocus={this.removeZipFocus}
          placeholder={
            t("city") + (this.state.keyboardOpen ? "" : t("required"))
          }
          placeholderTextColor={
            this.state.keyboardOpen ? undefined : ERROR_COLOR
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
          onSubmitEditing={() => this.setState({ stateOpen: true })}
        />
        <View style={{ flexDirection: "row" }}>
          <TouchableOpacity
            style={styles.pickerContainer}
            onPress={() => this.setState({ stateOpen: true })}
          >
            <Text
              content={
                this.props.value && this.props.value.state
                  ? this.props.value.state
                  : t("state")
              }
              style={styles.text}
            />
          </TouchableOpacity>
          <StateModal
            state={
              this.props.value && this.props.value!.state
                ? this.props.value!.state!
                : "WA"
            }
            visible={this.state.stateOpen}
            onDismiss={(state: string) => {
              this.setState({ stateOpen: false, focusZip: true });
              const address = this.props.value || {};
              address.state = state;
            }}
          />
          <NumberInput
            placeholder={
              t("zipcode") + (this.state.keyboardOpen ? "" : t("required"))
            }
            placeholderTextColor={
              this.state.keyboardOpen ? undefined : ERROR_COLOR
            }
            ref={this.zipcode}
            returnKeyType="done"
            style={[styles.inputRowRight, styles.textInput]}
            value={this.props.value ? this.props.value!.zipcode : undefined}
            onChangeText={(text: string) => {
              const address = this.props.value || {};
              address.zipcode = text;
              this.props.onChange(address);
              this.setState({ focusZip: false });
            }}
            onSubmitEditing={() => {
              this.setState({ focusZip: false });
            }}
          />
        </View>
      </View>
    );
  }
}

const styles = StyleSheet.create({
  container: {
    alignSelf: "stretch",
    marginBottom: GUTTER,
  },
  pickerContainer: {
    borderBottomColor: BORDER_COLOR,
    borderBottomWidth: StyleSheet.hairlineWidth,
    flex: 1,
    height: INPUT_HEIGHT,
    justifyContent: "center",
    padding: GUTTER / 4,
  },
  firstName: {
    flex: 1,
    height: INPUT_HEIGHT,
    padding: GUTTER / 4,
  },
  text: {
    color: LINK_COLOR,
    marginVertical: 0,
  },
  textInput: {
    height: INPUT_HEIGHT,
  },
  inputRowRight: {
    flex: 2,
    borderLeftColor: BORDER_COLOR,
    borderLeftWidth: StyleSheet.hairlineWidth,
  },
});

export default withNamespaces("addressInput")<Props>(AddressInput);
