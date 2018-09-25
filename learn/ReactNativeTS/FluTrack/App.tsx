import React from "react";
import { Component } from "react";
import { StyleSheet, Text, View } from "react-native";
import { Interaction } from "./src/components/Interaction";
import { logInteraction } from "./src/EventStore";

let x = 1;
function interact(): Promise<void> {
  return logInteraction(x++);
}

export default class App extends Component {
  render() {
    return (
      <View style={styles.container}>
        <Interaction callback={interact} />
      </View>
    );
  }
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff",
    alignItems: "center",
    justifyContent: "center",
    marginTop: "30%"
  }
});
