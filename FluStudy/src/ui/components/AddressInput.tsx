import React from "react";
import { StyleSheet, TouchableOpacity, View } from "react-native";
import { Address } from "../../store";
import { WithNamespaces, withNamespaces } from "react-i18next";
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
  TEXT_COLOR,
} from "../styles";

interface Props {
  autoFocus?: boolean;
  shouldValidate: boolean;
  value?: Address | null;
  onChange(value: Address): void;
  onSubmitEditing(): void;
}

interface State {
  stateOpen: boolean;
}

class AddressInput extends React.Component<Props & WithNamespaces, State> {
  lastName = React.createRef<TextInput>();
  address = React.createRef<TextInput>();
  address2 = React.createRef<TextInput>();
  city = React.createRef<TextInput>();
  stateProvince = React.createRef<TextInput>();
  zipcode = React.createRef<NumberInput>();

  constructor(props: Props & WithNamespaces) {
    super(props);
    this.state = {
      stateOpen: false,
    };
  }

  render() {
    const { shouldValidate, t } = this.props;
    return (
      <View style={styles.container}>
        <View style={{ flexDirection: "row" }}>
          <TextInput
            autoCapitalize="words"
            autoCorrect={false}
            autoFocus={this.props.autoFocus}
            placeholder={t("firstName") + (shouldValidate ? t("required") : "")}
            placeholderTextColor={shouldValidate ? ERROR_COLOR : undefined}
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
            placeholder={t("lastName") + (shouldValidate ? t("required") : "")}
            ref={this.lastName}
            placeholderTextColor={shouldValidate ? ERROR_COLOR : undefined}
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
          placeholder={
            t("streetAddress") + (shouldValidate ? t("required") : "")
          }
          placeholderTextColor={shouldValidate ? ERROR_COLOR : undefined}
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
          placeholder={t("streetAddress2")}
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
          placeholder={t("city") + (shouldValidate ? t("required") : "")}
          placeholderTextColor={shouldValidate ? ERROR_COLOR : undefined}
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
            this.setState({ stateOpen: true });
          }}
        />
        <View style={{ flexDirection: "row" }}>
          <TouchableOpacity
            style={styles.pickerContainer}
            onPress={() => {
              this.setState({ stateOpen: true });
            }}
          >
            <Text
              content={
                this.props.value && this.props.value.state
                  ? this.props.value.state
                  : t("state") + (shouldValidate ? t("required") : "")
              }
              style={[
                styles.statePlaceholder,
                shouldValidate &&
                  this.props.value &&
                  !this.props.value.state &&
                  styles.statePlaceholderError,
              ]}
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
              const address = this.props.value || {};
              address.state = state;
              this.props.onChange(address);
              this.setState({ stateOpen: false });
            }}
          />
          <NumberInput
            maxDigits={5}
            placeholder={t("zipcode") + (shouldValidate ? t("required") : "")}
            placeholderTextColor={shouldValidate ? ERROR_COLOR : undefined}
            ref={this.zipcode}
            returnKeyType="done"
            style={[styles.inputRowRight, styles.textInput]}
            value={this.props.value ? this.props.value!.zipcode : undefined}
            onChangeText={(text: string) => {
              const address = this.props.value || {};
              address.zipcode = text;
              this.props.onChange(address);
            }}
            onSubmitEditing={this.props.onSubmitEditing}
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
  statePlaceholder: {
    color: TEXT_COLOR,
    marginVertical: 0,
  },
  statePlaceholderError: {
    color: ERROR_COLOR,
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

export default withNamespaces("addressInput")(AddressInput);
