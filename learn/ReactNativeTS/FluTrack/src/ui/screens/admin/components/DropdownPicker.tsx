// Built for the admin screens as of November 8, but the November 10 update no
// longer uses this. Keeping in case useful somewhere else.
// Best used for short list of options, and each option text ~25 chars or less
import React from "react";
import { Icon } from "react-native-elements";
import {
  Text,
  View,
  TouchableOpacity,
  StyleSheet,
  ActionSheetIOS,
} from "react-native";

interface Props {
  label: string;
  onPress: any;
  options: string[];
}

export default class DropdownPicker extends React.Component<Props> {
  actionSheet() {
    ActionSheetIOS.showActionSheetWithOptions(
      {
        options: this.props.options,
        title: "Select one",
        tintColor: "black",
      },
      (buttonIndex: number) => {
        this.props.onPress(buttonIndex);
      }
    );
  }
  render() {
    return (
      <TouchableOpacity
        style={styles.button}
        onPress={() => {
          this.actionSheet();
        }}
      >
        <View style={styles.textContainer}>
          <Text style={styles.buttonText}>{this.props.label}</Text>
          <Icon name="chevron-down" color="gray" size={24} type="feather" />
        </View>
      </TouchableOpacity>
    );
  }
}

const styles = StyleSheet.create({
  button: {
    backgroundColor: "#f9fafa",
    padding: 10,
    opacity: 0.75,
    width: "100%",
    marginVertical: 2,
  },
  buttonText: {
    fontSize: 18,
    marginLeft: 10,
  },
  textContainer: {
    flex: 1,
    flexDirection: "row",
    justifyContent: "space-between",
  },
});
