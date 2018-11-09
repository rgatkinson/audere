import React, { Component } from "react";
import { View, StyleSheet, TouchableOpacity } from "react-native";
import Button from "./Button";
import Description from "./Description";
import Title from "./Title";

interface Props {
  active: boolean;
  buttons: any;
  description: string;
  title: string;
  onNext: any;
}

export default class SurveyQuestion extends Component<Props> {
  render() {
    return (
      <View style={[styles.card, !this.props.active && styles.inactive]}>
        <Title label={this.props.title} />
        {this.props.description && (
          <Description content={this.props.description} />
        )}
        <View style={styles.buttonContainer}>
          {this.props.buttons.map((button: any) => (
            <Button
              enabled={true}
              key={button.label}
              label={button.label}
              onPress={this.props.onNext}
              primary={button.primary}
            />
          ))}
        </View>
      </View>
    );
  }
}

const styles = StyleSheet.create({
  card: {
    justifyContent: "space-evenly",
    padding: 20,
  },
  buttonContainer: {
    alignItems: "center",
    justifyContent: "center",
  },
  buttonText: {
    color: "white",
  },
  inactive: {
    opacity: 0.25,
  },
});
