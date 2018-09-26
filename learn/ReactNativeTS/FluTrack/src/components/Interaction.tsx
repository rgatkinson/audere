import React from "react";
import { Component } from "react";
import {
  Button,
  StyleSheet,
  Text,
  View,
  ActivityIndicator
} from "react-native";

type AsyncCallback = () => Promise<void>;

interface Props {
  callback: AsyncCallback;
}

interface State {
  busy: boolean;
  errorText: string | null;
}

export class Interaction extends Component<Props, State> {
  state = {
    busy: false,
    errorText: null
  };

  render() {
    const { busy, errorText } = this.state;
    return (
      <View style={styles.centerNoJustify}>
        <Text style={styles.normalText}>
          This computer has just one button, and we push it before it leaves the
          factory.
        </Text>
        <View style={{ padding: 12 }}>
          <Button
            onPress={this.onPress}
            title="Click Here!"
            color="grey"
            disabled={busy}
          />
        </View>
        {busy && <ActivityIndicator size="large" />}
        {errorText && <Text style={styles.error}>{errorText}</Text>}
      </View>
    );
  }

  onPress = async () => {
    if (this.state.busy) {
      return;
    }
    console.debug("Interaction: busy=true");
    this.setState({
      busy: true,
      errorText: null
    });

    try {
      await this.props.callback();
      console.debug("Interaction: busy=false");
      this.setState({
        busy: false,
        errorText: null
      });
    } catch (e) {
      console.debug("Interaction: busy=false, but got error.");
      this.setState({
        busy: false,
        errorText: e.toString()
      });
    }
  };
}

const styles = StyleSheet.create({
  centerNoJustify: {
    flex: 1,
    alignItems: "center"
  },
  normalText: {
    textAlign: "center",
    fontSize: 18,
    padding: 12
  },
  error: {
    color: "red",
    fontWeight: "bold",
    fontSize: 24,
    margin: 32
  }
});
