import React from "react";
import Button from "../components/Button";
import ScreenView from "../components/ScreenView";
import { createUploader } from "../../transport";
import { goToNextScreen } from "../../../App";
import { logOut, StoreState } from "../../store";
import { connect } from "react-redux";
import { NavigationScreenProp } from "react-navigation";
import Text from "../components/Text";
import { WithNamespaces, withNamespaces } from "react-i18next";
import { Action } from "../../store";

interface Props {
  id: string;
  dispatch(action: Action): void;
  navigation: NavigationScreenProp<void>;
  screenProps: any;
}

@connect((state: StoreState) => ({ id: state.user!.id }))
class AccountScreen extends React.Component<Props & WithNamespaces> {
  static navigationOptions = ({
    navigation,
    screenProps,
  }: {
    navigation: NavigationScreenProp<void>;
    screenProps: any;
  }) => ({
    title: screenProps.t("account:title"),
  });

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
    this.props.screenProps.uploader.save("imagine-a-uuid-here", {
      name: "data",
    });

    goToNextScreen(this.props.navigation);
  };
}

export default withNamespaces("account")<Props & WithNamespaces>(AccountScreen);
