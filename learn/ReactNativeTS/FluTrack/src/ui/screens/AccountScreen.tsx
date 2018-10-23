import React from "react";
import Button from "../components/Button";
import ScreenView from "../components/ScreenView";
import { goToNextScreen } from "../../../App";
import { logOut, StoreState } from "../../store";
import { connect } from "react-redux";
import { NavigationScreenProp } from "react-navigation";
import Text from "../components/Text";
import { withI18n } from "react-i18next";

interface Props {
  id: string;
  dispatch(action: any): void;
  navigation: NavigationScreenProp<void>;
}

@connect((state: StoreState) => ({ id: state.user!.id }))
class AccountScreenBase extends React.Component<Props> {
  // static navigationOptions = {
  //   title: "My Account",
  // };

  render() {
    const { t, i18n } = this.props;
    return (
      <ScreenView>
        <Text>{t("account:introduction", { name: this.props.id })}</Text>
        <Button title={t("account:startFormButton")} onPress={this.startForm} />
        <Button title={t("account:logoutButton")} onPress={this.logOut} />
        <Button title="English" onPress={i18n.changeLanguage("en")} />
        <Button title="Chinese" onPress={i18n.changeLanguage("zh")} />
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

const AccountScreen = withI18n()(AccountScreenBase);
AccountScreen.navigationOptions = ({ navigation, screenProps }) => ({
  title: screenProps.t("account:heading"),
});

export default AccountScreen;
