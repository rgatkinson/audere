import React from "react";
import { StyleSheet, View } from "react-native";
import { connect } from "react-redux";
import { login, Action, StoreState } from "../store";
import Button from "./components/Button";
import NumberInput from "./components/NumberInput";
import { GUTTER } from "./styles";

interface Props {
  login: string;
  dispatch(action: Action): void;
}

class Login extends React.Component<Props> {
  state = { login: this.props.login };

  _changeLogin = (login: string) => {
    this.setState({ login });
  };

  _login = () => {
    this.props.dispatch(login(this.state.login));
  };

  render() {
    return (
      <View style={styles.container}>
        <NumberInput
          autoFocus={true}
          placeholder="Phone Number"
          returnKeyType="done"
          style={styles.input}
          value={this.state.login}
          onChangeText={this._changeLogin}
        />
        <Button
          enabled={true}
          label="Login"
          primary={true}
          style={styles.button}
          onPress={this._login}
        />
      </View>
    );
  }
}

export default connect((state: StoreState) => ({
  login: state.meta.login
}))(Login);

const styles = StyleSheet.create({
  button: {
    margin: GUTTER
  },
  container: {
    alignItems: "center",
    flex: 1,
    justifyContent: "center",
    margin: GUTTER
  },
  input: {
    margin: GUTTER,
    padding: GUTTER
  }
});
