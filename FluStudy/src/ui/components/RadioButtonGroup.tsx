import React from "react";
import {
  TouchableOpacity,
  View,
  StyleSheet,
  StyleProp,
  ViewStyle,
} from "react-native";
import { Address } from "../../store";
import Text from "./Text";
import { WithNamespaces, withNamespaces } from "react-i18next";
import {
  BORDER_WIDTH,
  GUTTER,
  RADIO_BUTTON_HEIGHT,
  REGULAR_TEXT,
  SECONDARY_COLOR,
  BORDER_COLOR,
  RADIO_INPUT_HEIGHT,
  TEXT_COLOR,
} from "../styles";

const RadioInput = (props: any) => {
  return (
    <View style={styles.radioInput}>
      {props.selected && <View style={styles.radioInputCenter} />}
    </View>
  );
};

const RadioButton = (props: any) => {
  const { address, city, state, zipcode } = props.address;
  return (
    <TouchableOpacity
      onPress={props.onSelect}
      style={[
        {
          display: "flex",
          flexDirection: "row",
          alignSelf: "stretch",
          marginBottom: 5,
          marginTop: 5,
        },
        styles.radioRow,
      ]}
    >
      <View style={{ padding: 10 }}>
        <RadioInput selected={props.selected} />
      </View>
      <View style={{ flex: 3, flexDirection: "column", padding: 5 }}>
        <Text
          style={[
            styles.radioText,
            props.selected && styles.selectedRadioColor,
          ]}
          content={address}
        />
        <Text
          style={[
            styles.radioText,
            props.selected && styles.selectedRadioColor,
          ]}
          content={`${city}, ${state} ${zipcode}`}
        />
      </View>
    </TouchableOpacity>
  );
};

interface Props {
  original: Address;
  suggestions: Address[];
  onChange(selectedAddress: Address): void;
  styles?: StyleProp<ViewStyle>;
}

interface State {
  selectedId: String | null;
}

class RadioButtonGroup extends React.Component<Props & WithNamespaces, State> {
  constructor(props: any) {
    super(props);
    this.state = {
      selectedId: "radio-original",
    };
  }

  _onSelect = (buttonId: string, selectedAddress: Address) => {
    this.setState({ selectedId: buttonId });
    this.props.onChange(selectedAddress);
  };

  render() {
    const { t } = this.props;
    return (
      <View style={[styles.container, this.props.styles]}>
        <Text
          content={t("suggestedAddress")}
          style={{
            fontSize: 14,
            color: "red",
            alignSelf: "flex-start",
            marginBottom: 5,
            fontStyle: "italic",
          }}
        />
        {this.props.suggestions.map((address, index) => {
          const buttonId = `radio-${index}`;
          return (
            <RadioButton
              address={address}
              key={buttonId}
              onSelect={this._onSelect.bind(this, buttonId, address)}
              selected={buttonId === this.state.selectedId}
            />
          );
        })}
        <Text
          content={t("originalAddress")}
          style={{
            fontSize: 14,
            color: "red",
            alignSelf: "flex-start",
            marginBottom: 5,
            fontStyle: "italic",
          }}
        />
        <RadioButton
          address={this.props.original}
          key={`radio-original`}
          onSelect={this._onSelect.bind(this, "radio-original")}
          selected={this.state.selectedId === "radio-original"}
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
  radioInput: {
    borderColor: TEXT_COLOR,
    borderWidth: BORDER_WIDTH,
    borderRadius: RADIO_INPUT_HEIGHT / 2,
    height: RADIO_INPUT_HEIGHT,
    width: RADIO_INPUT_HEIGHT,
  },
  radioInputCenter: {
    backgroundColor: SECONDARY_COLOR,
    borderRadius: RADIO_INPUT_HEIGHT / 4,
    margin: RADIO_INPUT_HEIGHT / 4 - 1,
    height: RADIO_INPUT_HEIGHT / 2,
    width: RADIO_INPUT_HEIGHT / 2,
  },
  radioRow: {
    borderColor: BORDER_COLOR,
    borderTopWidth: StyleSheet.hairlineWidth,
    minHeight: RADIO_BUTTON_HEIGHT,
    display: "flex",
    flexDirection: "row",
    alignSelf: "stretch",
  },
  radioRowLast: {
    borderColor: BORDER_COLOR,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderBottomWidth: StyleSheet.hairlineWidth,
    minHeight: RADIO_BUTTON_HEIGHT,
  },
  radioText: {
    fontSize: REGULAR_TEXT,
  },
  selectedRadioColor: {
    color: SECONDARY_COLOR,
    borderColor: SECONDARY_COLOR,
  },
});

export default withNamespaces("radioButtonGroup")(RadioButtonGroup);
