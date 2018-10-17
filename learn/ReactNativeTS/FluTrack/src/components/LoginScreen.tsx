import React from "react";
import { Platform, Dimensions, AsyncStorage } from "react-native";
import Button from "./ui/Button";
import FieldLabel from "./FieldLabel";
import ScreenView from "./ScreenView";
import { interact } from "../../App";
import { logIn } from "../store";
import MyText from "./MyText";
import ValidatedInput from "./ValidatedInput";
import { connect } from "react-redux";
let pjson = require("../../package.json");

const { height, width } = Dimensions.get("window");

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
    deviceOS: Platform.OS,
    deviceVersion: Platform.Version,
    screenHeight: height,
    screenWidth: width,
    appVersion: pjson.version,
  };

  render() {
    return (
      <ScreenView>
        <MyText size="title">
          {pjson.name}
          &trade;
        </MyText>
        <FieldLabel label="Login ID:">
          <ValidatedInput
            inputType="id"
            defaultValue={this.state.id}
            autoFocus={true}
            onChangeText={id => this.setState({ id })}
            onSubmitEditing={() => {
              this.passwordInput.focus();
            }}
          />
        </FieldLabel>
        <FieldLabel label="Password:">
          <ValidatedInput
            inputType="password"
            myRef={i => {
              this.passwordInput = i;
            }}
            onChangeText={password => this.setState({ password })}
          />
        </FieldLabel>
        <Button
          title="LOGIN"
          onPress={() => {
            this.props.dispatch(logIn(this.state.id, this.state.password));
            interact(JSON.stringify(this.state));
          }}
        />
      </ScreenView>
    );
  }
}

export default LoginScreen;
