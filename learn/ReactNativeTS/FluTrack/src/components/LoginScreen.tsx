import React from "react";
import { Platform, Dimensions } from "react-native";
import StyledButton from "./StyledButton";
import FieldLabel from "./FieldLabel";
import ScreenView from "./ScreenView";
import { interact } from "../../App";
import { NavigationScreenProp } from "react-navigation";
import MyText from "./MyText";
import ValidatedInput from "./ValidatedInput";
// import { connect } from "react-redux";
// import { SET_ID, SET_PASSWORD } from "../store/Constants";
let pjson = require("../../package.json");

interface Props {
  navigation: NavigationScreenProp<any, any>;
  onNext: string;
}
class LoginScreen extends React.Component<Props, any> {
  constructor(props: Props) {
    super(props);
    const { height, width } = Dimensions.get("window");
    this.state = {
      id: "",
      password: "",
      deviceOS: Platform.OS,
      deviceVersion: Platform.Version,
      screenHeight: height,
      screenWidth: width,
      appVersion: pjson.version,
      idError: false,
      passwordError: false
    };
  }
  // saveId = (text: string) => {
  //   this.props.dispatch({ type: SET_ID, payload: text });
  // };
  // savePassword = (text: string) => {
  //   this.props.dispatch({ type: SET_PASSWORD, text });
  // };
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
        <StyledButton
          title="LOGIN"
          onPress={() => {
            // this.saveId(this.state.id);
            // this.savePassword(this.state.password);
            interact(JSON.stringify(this.state));
            this.props.navigation.navigate(this.props.onNext);
          }}
        />
      </ScreenView>
    );
  }
}

export default LoginScreen;
// export default connect()(LoginScreen);
