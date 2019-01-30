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
import _ from "lodash";

interface Props {
  checked?: boolean;
  enabled: boolean;
  primary: boolean;
  label: string;
  style?: StyleProp<ViewStyle>;
  onPress?(event: GestureResponderEvent): void;
}

export default class Button extends React.Component<Props> {
  constructor(props: Props) {
    super(props);
    this.handlePress = _.debounce(this.handlePress, 1000);
  }

  handlePress = (event: GestureResponderEvent) => {
    this.props.enabled &&
      this.props.onPress != null &&
      this.props.onPress(event);
  };

  render() {
    return (
      <View
        style={[
          styles.container,
          { opacity: this.props.enabled ? 0.95 : 0.5 },
          this.props.style && this.props.style,
        ]}
      >
        <TouchableOpacity
          disabled={!this.props.enabled}
          style={[styles.button, this.props.primary && styles.primaryButton]}
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
              this.props.primary
                ? styles.primaryButtonText
                : styles.secondaryButtonText,
            ]}
          >
            {this.props.label}
          </Text>
        </TouchableOpacity>
      </View>
    );
  }
}

const styles = StyleSheet.create({
  button: {
    alignItems: "center",
    borderColor: "#9fa1a5",
    borderRadius: 4,
    borderWidth: 2,
    flexDirection: "row",
    height: 40,
    justifyContent: "center",
  },
  check: {
    paddingRight: 8,
  },
  container: {
    marginVertical: 10,
    width: 300,
  },
  text: {
    fontFamily: "OpenSans-SemiBold",
    fontSize: 17,
    letterSpacing: -0.41,
    lineHeight: 22,
    textAlign: "center",
  },
  primaryButton: {
    backgroundColor: "#9fa1a5",
  },
  primaryButtonText: {
    color: "#FFFFFF",
  },
  secondaryButtonText: {
    color: "#404347",
  },
});
