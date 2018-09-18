import React from "react";
import { Component } from "react";
import {
  Button,
  StyleSheet,
  Text,
  View,
  AppRegistry,
  ActivityIndicator
} from "react-native";

export class Interaction extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = {
      busy: false,
      errorText: null
    };
    this.onPress = this.onPress.bind(this);
  }

  render() {
    return (
      <View style={styles.centerNoJustify}>
        <Text style={styles.normalText}>
          This computer has just one button, and we push it before it leaves the
          factory.
        </Text>
        <Button
          onPress={this.onPress}
          title="Click Here!"
          color="grey"
          disabled={this.state.busy}
        />
        {this.state.busy && <ActivityIndicator size="large" />}
        {this.state.errorText && (
          <Text style={styles.error}>{this.state.errorText}</Text>
        )}
      </View>
    );
  }

  onPress() {
    if (!this.state.busy) {
      console.debug("Interaction: busy=true");
      this.setState({
        busy: true,
        errorText: null
      });

      this.props
        .callback()
        .then(() => {
          console.debug("Interaction: busy=false");
          this.setState({
            busy: false,
            errorText: null
          });
        })
        .catch(e => {
          console.debug("Interaction: busy=false, but got error.");
          this.setState({
            busy: false,
            errorText: e.toString()
          });
        });
    }
  }
}

const styles = StyleSheet.create({
  centerNoJustify: {
    flex: 1,
    alignItems: "center"
  },
  normalText: {
    textAlign: "center",
    fontSize: 18,
    margin: 32
  },
  error: {
    color: "red",
    fontWeight: "bold",
    fontSize: 24,
    margin: 32
  }
});

export interface Props {
  callback: AsyncCallback;
}

interface State {
  busy: boolean;
  errorText: string | null;
}

export interface AsyncCallback {
  (): Promise<void>;
}

AppRegistry.registerComponent("FluTrack", () => Interaction);
