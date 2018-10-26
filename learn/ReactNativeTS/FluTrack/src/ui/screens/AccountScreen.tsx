import React from "react";
import Button from "../components/Button";
import ScreenView from "../components/ScreenView";
import { goToNextScreen } from "../../../App";
import { logOut, StoreState } from "../../store";
import { connect } from "react-redux";
import { NavigationScreenProp } from "react-navigation";
import Text from "../components/Text";
import { Alert } from "react-native";

interface Props {
  id: string;
  dispatch(action: any): void;
  navigation: NavigationScreenProp<void>;
}

@connect((state: StoreState) => ({ id: state.user!.id }))
export default class AccountScreen extends React.Component<Props> {
  static navigationOptions = {
    title: "My Account",
  };

  render() {
    return (
      <ScreenView>
        <Text>Hello, {this.props.id}</Text>
        <Button title="START FORM" onPress={this.startForm} />
        <Button title="LOGOUT" onPress={this.logOut} />
        <Button
          title="ABOUT"
          onPress={() => {
            Alert.alert("About me!");
          }}
        />
      </ScreenView>
    );
  }

  logOut = () => {
    this.props.dispatch(logOut());
  };

  startForm = () => {
    goToNextScreen(this.props.navigation);
  };
}
