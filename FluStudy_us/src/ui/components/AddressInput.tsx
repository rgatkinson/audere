import React from "react";
import { StyleSheet, View, StyleProp, ViewStyle, Platform } from "react-native";
import { WithNamespaces, withNamespaces } from "react-i18next";
import NumberInput from "./NumberInput";
import Text from "./Text";
import TextInput from "./TextInput";

import {
  BORDER_COLOR,
  ERROR_COLOR,
  FONT_NORMAL,
  GUTTER,
  INPUT_HEIGHT,
  REGULAR_TEXT,
} from "../styles";

interface Props {
  autoFocus?: boolean;
  shouldValidate: boolean;
  value?: any;
  onChange(value: any): void;
  onSubmitEditing(): void;
}

interface State {
  stateOpen: boolean;
}

class AddressInput extends React.Component<Props & WithNamespaces, State> {
  lastName = React.createRef<TextInput>();
  email = React.createRef<TextInput>();
  zipcode = React.createRef<NumberInput>();

  constructor(props: Props & WithNamespaces) {
    super(props);
    this.state = {
      stateOpen: false,
    };

    this._getRef = this._getRef.bind(this);
  }

  _getRef(propName: string) {
    if ((this as any).hasOwnProperty(propName)) {
      return (this as any)[propName];
    } else {
      return null;
    }
  }

  renderTextInput(
    placeholder: string,
    property: string,
    focusNext: string,
    required: boolean,
    style?: StyleProp<ViewStyle>,
    autoFocus?: boolean
  ) {
    const { shouldValidate, t } = this.props;
    return (
      <TextInput
        autoCapitalize={Platform.OS === "android" ? "sentences" : "words"}
        autoCorrect={false}
        autoFocus={!!autoFocus}
        placeholder={placeholder}
        placeholderTextColor={
          !!required && shouldValidate ? ERROR_COLOR : undefined
        }
        ref={this._getRef(property)}
        returnKeyType="next"
        style={style}
        value={
          this.props.value ? (this.props.value! as any)[property] : undefined
        }
        onChangeText={(text: string) => {
          const address = this.props.value || {};
          (address as any)[property] = text;
          this.props.onChange(address);
        }}
        onSubmitEditing={() => {
          if (focusNext === "zipcode") {
            this.setState({ stateOpen: true });
          }
          this._getRef(focusNext).current!.focus();
        }}
      />
    );
  }

  render() {
    const { shouldValidate, t } = this.props;
    return (
      <View style={styles.container}>
        <View style={{ flexDirection: "row" }}>
          {this.renderTextInput(
            t("firstName"),
            "firstName",
            "lastName",
            true,
            styles.firstName,
            this.props.autoFocus
          )}
          {this.renderTextInput(
            t("lastName"),
            "lastName",
            "email",
            true,
            styles.inputRowRight
          )}
        </View>
        {this.renderTextInput(
          t("email"),
          "email",
          "zipcode",
          true,
          styles.firstName,
          false
        )}
        <NumberInput
          maxDigits={5}
          placeholder={t("zipcode")}
          placeholderTextColor={shouldValidate ? ERROR_COLOR : undefined}
          ref={this.zipcode}
          returnKeyType="done"
          style={[styles.textInput]}
          value={this.props.value ? this.props.value!.zipcode : undefined}
          onChangeText={(text: string) => {
            const address = this.props.value || {};
            address.zipcode = text;
            this.props.onChange(address);
          }}
          onSubmitEditing={this.props.onSubmitEditing}
        />

        <Text
          content={
            this.props.value &&
            this.props.value.zipcode &&
            this.props.value.zipcode.length < 5 &&
            this.props.shouldValidate
              ? t("common:validationErrors:zipcode")
              : ""
          }
          style={styles.errorText}
        />
      </View>
    );
  }
}

const styles = StyleSheet.create({
  container: {
    alignSelf: "stretch",
    marginBottom: GUTTER,
  },
  errorText: {
    color: ERROR_COLOR,
    fontFamily: FONT_NORMAL,
    marginTop: GUTTER / 2,
    alignSelf: "flex-end",
  },
  firstName: {
    flex: 1,
    height: INPUT_HEIGHT,
    padding: GUTTER / 4,
  },
  inputRowRight: {
    flex: 2,
    borderLeftColor: BORDER_COLOR,
    borderLeftWidth: StyleSheet.hairlineWidth,
  },
  pickerContainer: {
    borderBottomColor: BORDER_COLOR,
    borderBottomWidth: StyleSheet.hairlineWidth,
    flex: 1,
    height: INPUT_HEIGHT,
    justifyContent: "center",
    padding: GUTTER / 4,
  },
  select: {
    borderWidth: 0,
    padding: 0,
  },
  selectText: {
    fontFamily: FONT_NORMAL,
    fontSize: REGULAR_TEXT,
    padding: 0,
  },
  textInput: {
    height: INPUT_HEIGHT,
  },
});

export default withNamespaces("addressInput")(AddressInput);
