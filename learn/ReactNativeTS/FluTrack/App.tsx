import React from "react";
import { Component } from "react";
import { StyleSheet, Text, View } from "react-native";
import { Interaction } from "./src/components/Interaction";

export default class App extends Component {
  render() {
    let x = 1;
    function interact(): Promise<void> {
      return new Promise((resolve, reject) => {
        console.debug("Started interaction!");
        setTimeout(() => {
          console.debug("Completed interaction!");
          if (++x % 3 == 0) {
            reject(`Failed because x is ${x}`);
          } else {
            resolve();
          }
        }, 2000);
      });
    }

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
