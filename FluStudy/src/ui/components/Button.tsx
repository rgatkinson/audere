import React from "react";
import {
  GestureResponderEvent,
  StyleProp,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  ViewStyle,
} from "react-native";
import { Feather } from "@expo/vector-icons";
import {
  BORDER_COLOR,
  BORDER_RADIUS,
  BORDER_WIDTH,
  FONT_SEMI_BOLD,
  GUTTER,
  INPUT_HEIGHT,
  LARGE_TEXT,
  PRIMARY_COLOR,
  SECONDARY_COLOR,
} from "../styles";

interface Props {
  checked?: boolean;
  enabled: boolean;
  fontSize?: number;
  primary: boolean;
  label: string;
  style?: StyleProp<ViewStyle>;
  onPress?(event: GestureResponderEvent): void;
}

export default class Button extends React.Component<Props> {
  handlePress = (event: GestureResponderEvent) => {
    this.props.enabled &&
      this.props.onPress != null &&
      this.props.onPress(event);
  };

  render() {
    return (
      <TouchableOpacity
        disabled={!this.props.enabled}
        style={[
          styles.button,
          { opacity: this.props.enabled ? 0.95 : 0.5 },
          this.props.primary && styles.primaryButton,
          this.props.style && this.props.style,
        ]}
        onPress={this.handlePress}
      >
        {this.props.checked && (
          <Feather
            name="check"
            color={this.props.primary ? "#FFFFFF" : "#4B2E83"}
            size={20}
            style={styles.check}
          />
        )}
        <Text
          style={[
            styles.text,
            this.props.primary && styles.primaryButtonText,
            !!this.props.fontSize && { fontSize: this.props.fontSize },
          ]}
        >
          {this.props.label}
        </Text>
      </TouchableOpacity>
    );
  }
}

const styles = StyleSheet.create({
  button: {
    alignItems: "center",
    alignSelf: "stretch",
    borderColor: PRIMARY_COLOR,
    borderRadius: BORDER_RADIUS,
    borderWidth: BORDER_WIDTH,
    flexDirection: "row",
    height: INPUT_HEIGHT,
    justifyContent: "center",
    marginBottom: GUTTER,
  },
  check: {
    paddingRight: GUTTER / 2,
  },
  text: {
    fontFamily: FONT_SEMI_BOLD,
    fontSize: LARGE_TEXT,
    textAlign: "center",
  },
  primaryButton: {
    backgroundColor: PRIMARY_COLOR,
  },
  primaryButtonText: {
    color: "white",
  },
});
