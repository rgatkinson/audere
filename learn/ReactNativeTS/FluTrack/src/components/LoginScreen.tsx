import React from "react";
import { Text, TextInput, Platform, Dimensions } from "react-native";
import StyledButton from "./StyledButton";
import FieldLabel from "./FieldLabel";
import ScreenView from "./ScreenView";
import { interact } from "../../App";
import styles from "../Styles";
import { NavigationScreenProp } from "react-navigation";
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
  isValid(text: string, inputType: string): boolean {
    // Return true if valid, false if invalid

    let idPattern = /^[a-zA-Z0-9_-]{3,16}$/;
    let passwordPattern = /^.{6,}$/;
    if (inputType == "id") {
      return idPattern.test(text);
    } else if (inputType == "password") {
      return passwordPattern.test(text);
    }
    return true;
  }
  render() {
    return (
      <ScreenView>
        <Text style={styles.titleText}>
          {pjson.name}
          &trade;
        </Text>
        <FieldLabel label="Login ID:">
          <TextInput
            style={[
              styles.inputField,
              this.state.idError ? styles.errorBorder : null
            ]}
            autoFocus={true}
            keyboardType="email-address"
            autoCapitalize="none"
            underlineColorAndroid="rgba(0,0,0,0)"
            onChangeText={id => this.setState({ id })}
            onSubmitEditing={() => {
              this.setState({
                idError: !this.isValid(this.state.id, "id")
              });
            }}
          />
        </FieldLabel>
        <FieldLabel label="Password:">
          <TextInput
            style={[
              styles.inputField,
              this.state.passwordError ? styles.errorBorder : null
            ]}
            secureTextEntry={true}
            underlineColorAndroid="rgba(0,0,0,0)"
            onChangeText={password => this.setState({ password })}
            onSubmitEditing={() => {
              this.setState({
                passwordError: !this.isValid(this.state.password, "password")
              });
            }}
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
