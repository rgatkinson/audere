import React from "react";
import { Platform, Dimensions, AsyncStorage } from "react-native";
import StyledButton from "./StyledButton";
import FieldLabel from "./FieldLabel";
import ScreenView from "./ScreenView";
import { interact } from "../../App";
import { NavigationScreenProp } from "react-navigation";
import MyText from "./MyText";
import ValidatedInput from "./ValidatedInput";
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
      isLoading: true,
      idLoaded: false
    };
  }
  componentWillMount() {
    AsyncStorage.getItem("id").then(value => {
      if (value !== null) {
        this.setState({
          id: JSON.parse(value),
          idLoaded: JSON.parse(value).length != 0
        });
      }
      this.setState({ isLoading: false });
    });
  }
  render() {
    if (this.state.isLoading) {
      // Need this block so that the real render will not run until AsyncStorage fetch is complete
      return <ScreenView />;
    } else {
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
              autoFocus={!this.state.idLoaded}
              onChangeText={id => this.setState({ id })}
              onSubmitEditing={() => {
                this.passwordInput.focus();
              }}
            />
          </FieldLabel>
          <FieldLabel label="Password:">
            <ValidatedInput
              inputType="password"
              autoFocus={this.state.idLoaded}
              myRef={i => {
                this.passwordInput = i;
              }}
              onChangeText={password => this.setState({ password })}
            />
          </FieldLabel>
          <StyledButton
            title="LOGIN"
            onPress={() => {
              AsyncStorage.setItem("id", JSON.stringify(this.state.id));
              interact(JSON.stringify(this.state));
              this.props.navigation.navigate(this.props.onNext);
            }}
          />
        </ScreenView>
      );
    }
  }
}

export default LoginScreen;
