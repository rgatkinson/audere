import React from "react";
import { Text, View, TouchableOpacity, StyleSheet } from "react-native";
import { Feather } from '@expo/vector-icons';
import { colors } from "../Styles";

interface Props {
  label: string;
  onPress: any;
  disabled?: boolean;
}

export default class EditSettingButton extends React.Component<Props> {
  render() {
    return (
      <TouchableOpacity
        style={[
          styles.button,
          this.props.disabled ? null : styles.enabledButton,
        ]}
        onPress={this.props.onPress}
        disabled={this.props.disabled}
      >
        <View style={styles.textContainer}>
          <Text
            style={[
              styles.buttonText,
              this.props.disabled ? styles.disabledText : null,
            ]}
          >
            {this.props.label}
          </Text>
          <Feather
            name="chevron-right"
            color={this.props.disabled ? colors.disabledText : "gray"}
            size={24}
          />
        </View>
      </TouchableOpacity>
    );
  }
}

const styles = StyleSheet.create({
  button: {
    padding: 10,
    width: "100%",
    marginVertical: 2,
  },
  enabledButton: {
    opacity: 0.75,
    backgroundColor: "#f9fafa",
  },
  buttonText: {
    fontSize: 18,
    marginLeft: 10,
  },
  disabledText: {
    color: colors.disabledText,
  },
  textContainer: {
    flex: 1,
    flexDirection: "row",
    justifyContent: "space-between",
  },
});
