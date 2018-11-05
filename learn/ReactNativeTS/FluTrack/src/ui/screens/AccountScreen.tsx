import React from "react";
import Button from "../components/Button";
import ScreenView from "../components/ScreenView";
import { createUploader } from "../../transport";
import { goToNextScreen } from "../../../App";
import { logOut, StoreState } from "../../store";
import { connect } from "react-redux";
import { NavigationScreenProp } from "react-navigation";
import Text from "../components/Text";
import { withNamespaces } from "react-i18next";

// TODO: pass this through from App as a property.
const uploader = createUploader();

interface Props {
  id: string;
  dispatch(action: any): void;
  navigation: NavigationScreenProp<void>;
}

@connect((state: StoreState) => ({ id: state.user!.id }))
class AccountScreenBase extends React.Component<Props> {
  render() {
    const { t, i18n } = this.props;
    return (
      <ScreenView>
        <Text>{t("introduction", { name: this.props.id })}</Text>
        <Button title={t("startFormButton")} onPress={this.startForm} />
        <Button title={t("logoutButton")} onPress={this.logOut} />
        <Button
          title="English"
          onPress={() => {
            i18n.changeLanguage("en");
          }}
        />
        <Button
          title="Español"
          onPress={() => {
            i18n.changeLanguage("es");
          }}
        />
      </ScreenView>
    );
  }

  logOut = () => {
    this.props.dispatch(logOut());
  };

  startForm = () => {
    // TODO: generate JSON document to upload.
    uploader.save("imagine-a-uuid-here", { name: "data" });

    goToNextScreen(this.props.navigation);
  };
}

// https://reactjs.org/docs/higher-order-components.html
const AccountScreen = withNamespaces("account")(AccountScreenBase);
AccountScreen.navigationOptions = ({ navigation, screenProps }) => ({
  title: screenProps.t("account:title"),
});

export default AccountScreen;
