import React from "react";
import { NavigationScreenProp } from "react-navigation";
import { WithNamespaces, withNamespaces } from "react-i18next";
import InfoScreen from "../../components/InfoScreen";

interface Props {
  navigation: NavigationScreenProp<any, any>;
}

class ConfirmationScreen extends React.Component<Props & WithNamespaces> {
  _onNext = () => {
    this.props.navigation.push("PushNotifications");
  };

  render() {
    const { t } = this.props;
    return (
      <InfoScreen
        desc={t("description")}
        imageSrc={require("../../../img/confirmation.png")}
        navBar={true}
        navigation={this.props.navigation}
        title={t("confirmed")}
        onNext={this._onNext}
      />
    );
  }
}

export default withNamespaces("confirmationScreen")<Props>(ConfirmationScreen);
