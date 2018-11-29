import React from "react";
import { Image, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { Icon } from "react-native-elements";
import { NavigationScreenProp } from "react-navigation";
import { connect } from "react-redux";
import { Action, startForm } from "../../../store";

interface Props {
  dispatch(action: Action): void;
  navigation: NavigationScreenProp<any, any>;
  uploader: any;
}

@connect()
export default class HomeScreen extends React.Component<Props> {
  _onStart = () => {
    this.props.dispatch(startForm());
    this.props.navigation.push("Welcome");
  };

  render() {
    return (
      <View style={styles.container}>
        <Image
          style={{ height: 30, width: 380 }}
          source={require("../../../img/UWLogo.png")}
        />
        <Text style={styles.title}>SEATTLE FLU STUDY</Text>
        <TouchableOpacity style={styles.button} onPress={this._onStart}>
          <Text style={styles.buttonHeader}>Welcome</Text>
          <View style={styles.textContainer}>
            <Text style={styles.buttonText}>
              Learn more about this research and how to participate.
            </Text>
            <Icon
              name="chevron-right"
              color="#007AFF"
              size={32}
              type="feather"
            />
          </View>
        </TouchableOpacity>
      </View>
    );
  }
}

const styles = StyleSheet.create({
  button: {
    backgroundColor: "#EEEEEE",
    borderRadius: 13,
    height: 250,
    padding: 30,
    width: 534,
  },
  buttonHeader: {
    fontSize: 33,
    fontFamily: "OpenSans-Bold",
    letterSpacing: -0.8,
    lineHeight: 40,
  },
  buttonText: {
    fontFamily: "OpenSans-Regular",
    fontSize: 21,
    letterSpacing: -0.51,
    lineHeight: 26,
  },
  container: {
    alignItems: "center",
    backgroundColor: "#4B2E83",
    flex: 1,
    justifyContent: "center",
  },
  textContainer: {
    alignItems: "flex-start",
    flexDirection: "row",
    paddingTop: 40,
    justifyContent: "space-between",
  },
  title: {
    color: "#FFFFFF",
    fontFamily: "UniSansRegular",
    fontSize: 53,
    letterSpacing: 0.63,
    lineHeight: 62,
    paddingBottom: 61,
    paddingTop: 43,
  },
});
