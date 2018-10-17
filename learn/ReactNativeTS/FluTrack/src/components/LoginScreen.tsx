import React from "react";
import { TextInput, Dimensions, Platform } from "react-native";
import Button from "./ui/Button";
import FieldLabel from "./FieldLabel";
import ScreenView from "./ScreenView";
import { logIn } from "../store";
import MyText from "./MyText";
import ValidatedInput from "./ValidatedInput";
import { connect } from "react-redux";
import { interact } from "../../App";

const packageInfo = require("../../package.json");

interface Props {
  dispatch(action: any): void;
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
    interact(JSON.stringify(data));
  }

  render() {
    return (
      <ScreenView>
        <MyText size="title">
          {packageInfo.name}
          &trade;
        </MyText>
        <FieldLabel label="Login ID:">
          <ValidatedInput
            inputType="id"
            defaultValue={this.state.id}
            autoFocus={true}
            onChangeText={id => this.setState({ id })}
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
            onChangeText={password => this.setState({ password })}
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
