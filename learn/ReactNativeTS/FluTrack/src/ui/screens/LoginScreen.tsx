import React from "react";
import { TextInput, Dimensions, Platform } from "react-native";
import Button from "../components/Button";
import FieldLabel from "../components/FieldLabel";
import ScreenView from "../components/ScreenView";
import { logIn, Action } from "../../store";
import Text from "../components/Text";
import ValidatedInput from "../components/ValidatedInput";
import { connect } from "react-redux";

const packageInfo = require("../../../package.json");

interface Props {
  dispatch(action: Action): void;
}

@connect()
class LoginScreen extends React.Component<Props> {
  static navigationOptions = {
    title: "Login",
  };

  state = {
    id: "",
    password: "",
  };

  passwordInput = React.createRef<TextInput>();

  componentDidMount() {
    const { height, width } = Dimensions.get("window");
    const data = {
      deviceOS: Platform.OS,
      deviceVersion: Platform.Version,
      screenHeight: height,
      screenWidth: width,
      appVersion: packageInfo.version,
    };
  }

  render() {
    return (
      <ScreenView>
        <Text size="title">
          {packageInfo.name}
          &trade;
        </Text>
        <FieldLabel label="Login ID:">
          <ValidatedInput
            inputType="id"
            defaultValue={this.state.id}
            autoFocus={true}
            onChangeText={(id: string) => this.setState({ id })}
            onSubmitEditing={() => {
              const { current } = this.passwordInput;
              current && current.focus();
            }}
          />
        </FieldLabel>
        <FieldLabel label="Password:">
          <ValidatedInput
            inputType="password"
            myRef={this.passwordInput}
            onChangeText={(password: string) => this.setState({ password })}
          />
        </FieldLabel>
        <Button title="LOGIN" onPress={this.logIn} />
      </ScreenView>
    );
  }

  logIn = () => {
    this.props.dispatch(logIn(this.state.id, this.state.password));
  };
}

export default LoginScreen;
