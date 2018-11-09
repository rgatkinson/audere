import React from "react";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";

interface Props {
  enabled: boolean;
  primary: boolean;
  label: string;
  subtext?: string;
  onPress: any;
}

export default class Button extends React.Component<Props> {
  render() {
    const subtext = this.props.subtext
      ? <Text style={styles.subtext}>{this.props.subtext}</Text>
      : null;

    return (
      <View style={[
        styles.buttonContainer, 
        { opacity: this.props.enabled ? 1.0 : 0.5 },
      ]}>
        <TouchableOpacity
          style={[
            styles.button,
            this.props.primary ? styles.primaryButton : null,
          ]}
          onPress={this.props.enabled ? this.props.onPress : null}>
          <Text style={[
            styles.text,
            this.props.primary ? styles.primaryButtonText : styles.secondaryButtonText
          ]}>
            {this.props.label} 
          </Text>
        </TouchableOpacity>
        {subtext} 
      </View>
    );
  }
}

const styles = StyleSheet.create({
  button: {
    borderColor: '#6200EE',
    borderRadius: 10,
    borderWidth: 2,
    justifyContent: 'center',
    padding: 10,
  },
  buttonContainer: {
    width: 325,
    marginVertical: 20,
  },
  text: {
    fontSize: 20,
    textAlign: 'center',
  },
  primaryButton: {
    backgroundColor: '#6200EE',
  },
  primaryButtonText: {
    color: 'white',
  },
  secondaryButtonText: {
    color: '#6200EE',
  },
  subtext: {
    fontSize: 20,
    margin: 10,
  },
});
