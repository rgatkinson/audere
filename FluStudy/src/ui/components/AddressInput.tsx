import React from "react";
import {
  StyleSheet,
  TouchableOpacity,
  View,
  StyleProp,
  ViewStyle,
} from "react-native";
import { Address } from "../../store";
import { WithNamespaces, withNamespaces } from "react-i18next";
import { isValidAddress } from "../../util/check";
import NumberInput from "./NumberInput";
import StateModal from "./StateModal";
import Text from "./Text";
import TextInput from "./TextInput";
import {
  BORDER_COLOR,
  ERROR_COLOR,
  FONT_NORMAL,
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
  city = React.createRef<TextInput>();
  stateProvince = React.createRef<TextInput>();
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
        autoCapitalize="words"
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
            "address",
            true,
            styles.inputRowRight
          )}
        </View>
        {this.renderTextInput(
          t("streetAddress"),
          "address",
          "city",
          true,
          styles.textInput
        )}
        {this.renderTextInput(
          t("city"),
          "city",
          "zipcode",
          true,
          styles.textInput
        )}
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
                  : t("state")
              }
              style={[
                styles.statePlaceholder,
                shouldValidate &&
                  (!this.props.value ||
                    (this.props.value && !this.props.value.state)) &&
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
            placeholder={t("zipcode")}
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
  errorText: {
    color: ERROR_COLOR,
    fontFamily: FONT_NORMAL,
    marginTop: GUTTER / 2,
    alignSelf: "flex-end",
  },
});

export default withNamespaces("addressInput")(AddressInput);
