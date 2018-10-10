import React from "react";
import { Text, TextInput, Platform, Dimensions, Alert } from "react-native";
import StyledButton from "./StyledButton";
import FieldLabel from "./FieldLabel";
import ScreenView from "./ScreenView";
import { interact } from "../../App";
import styles from "../Styles";
let pjson = require("../../package.json");

export default class LoginScreen extends React.Component {
  constructor(props) {
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

  validate(text: string, type: string) {
    let idPattern = /^[a-zA-Z0-9_-]{3,16}$/;
    if (type == "id") {
      this.setState({ id: text });
      if (idPattern.test(text)) {
        this.setState({ idError: false });
      } else {
        this.setState({ idError: true });
      }
    }
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
            onChangeText={id => this.validate(id, "id")}
          />
        </FieldLabel>
        <FieldLabel label="Password:">
          <TextInput
            style={styles.inputField}
            secureTextEntry={true}
            underlineColorAndroid="rgba(0,0,0,0)"
            onChangeText={password => this.setState({ password })}
          />
        </FieldLabel>

        <StyledButton
          title="LOGIN"
          onPress={() => {
            interact(JSON.stringify(this.state));
            this.props.navigation.navigate(this.props.onNext);
          }}
        />
      </ScreenView>
    );
  }
}
