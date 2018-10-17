import React from "react";
import Button from "./ui/Button";
import ScreenView from "./ScreenView";
import { goToNextScreen } from "../../App";
import { logOut, StoreState } from "../store";
import { connect } from "react-redux";
import { NavigationScreenProp } from "react-navigation";
import MyText from "./MyText";

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
        <MyText>Hello, {this.props.id}</MyText>
        <Button title="START FORM" onPress={this.startForm} />
        <Button title="LOGOUT" onPress={this.logOut} />
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
