import React from "react";
import { NavigationScreenProp } from "react-navigation";
import { WithNamespaces, withNamespaces } from "react-i18next";
import Button from "../../components/Button";
import InfoScreen from "../../components/InfoScreen";

interface Props {
  navigation: NavigationScreenProp<any, any>;
}

class PushNotificationsScreen extends React.Component<Props & WithNamespaces> {
  _onYes = () => {
    // TODO want to only set onNext in nav bar to onYes if they push yes...
    // TODO save response
    this.props.navigation.push("Instructions");
  };

  _onNo = () => {
    // TODO save response
    this.props.navigation.push("Instructions");
  };

  render() {
    const { t } = this.props;
    return (
      <InfoScreen
        buttonLabel={t("common:button:yes")}
        desc={t("description")}
        imageSrc={require("../../../img/pushNotifications.png")}
        navBar={true}
        navigation={this.props.navigation}
        title={t("pushNotifications")}
        onNext={this._onYes}
      >
        <Button
          enabled={true}
          primary={true}
          label={t("common:button:no")}
          onPress={this._onNo}
        />
      </InfoScreen>
    );
  }
}

export default withNamespaces("pushNotificationsScreen")<Props>(
  PushNotificationsScreen
);
