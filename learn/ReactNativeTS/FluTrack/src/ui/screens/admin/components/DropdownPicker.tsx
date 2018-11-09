//Please help with a better name for this component.
//It mimics the links/buttons in the iPad Settings panel that drill into sub-settings pages
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
