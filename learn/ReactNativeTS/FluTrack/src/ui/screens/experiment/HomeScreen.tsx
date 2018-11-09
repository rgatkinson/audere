import React from "react";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { Icon } from "react-native-elements";
import { connect } from "react-redux";
import { NavigationScreenProp } from "react-navigation";
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
        <Text style={styles.subTitle}>University of Washington</Text>
        <Text style={styles.title}>Seattle Flu Study</Text>
        <TouchableOpacity style={styles.button} onPress={this._onStart}>
          <Text style={styles.buttonHeader}>Welcome</Text>
          <View style={styles.textContainer}>
            <Text style={styles.buttonText}>
              Learn more about this research and how to participate.
            </Text>
            <Icon name="chevron-right" color="blue" size={32} type="feather" />
          </View>
        </TouchableOpacity>
      </View>
    );
  }
}

const styles = StyleSheet.create({
  button: {
    backgroundColor: "#f9fafa",
    borderRadius: 10,
    padding: 30,
    opacity: 0.75,
    justifyContent: "space-between",
  },
  buttonHeader: {
    fontSize: 24,
    fontWeight: "bold",
    paddingBottom: 30,
  },
  buttonText: {
    fontSize: 20,
    width: 400,
    paddingRight: 30,
  },
  container: {
    alignItems: "center",
    backgroundColor: "#6200EE",
    flex: 1,
    justifyContent: "center",
    padding: 100,
  },
  subTitle: {
    color: "white",
    fontFamily: "Georgia",
    fontSize: 32,
    paddingBottom: 15,
  },
  textContainer: {
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "space-between",
    paddingBottom: 30,
  },
  title: {
    color: "white",
    fontFamily: "Georgia",
    fontSize: 48,
    fontStyle: "italic",
    fontWeight: "bold",
    paddingBottom: 70,
  },
});
