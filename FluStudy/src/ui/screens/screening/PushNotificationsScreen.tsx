import React from "react";
import { Dimensions, Image } from "react-native";
import { NavigationScreenProp } from "react-navigation";
import Button from "../../components/Button";
import ContentContainer from "../../components/ContentContainer";
import NavigationBar from "../../components/NavigationBar";
import Text from "../../components/Text";
import Title from "../../components/Title";
import ScreenContainer from "../../components/ScreenContainer";
import { WithNamespaces, withNamespaces } from "react-i18next";

interface Props {
  navigation: NavigationScreenProp<any, any>;
}

class PushNotificationsScreen extends React.Component<Props & WithNamespaces> {
  _onNext = () => {
    // TODO save response
    this.props.navigation.push("Instructions");
  };

  render() {
    const { t } = this.props;
    return (
      <ScreenContainer>
        <NavigationBar
          canProceed={true}
          navigation={this.props.navigation}
          onNext={this._onNext}
        />
        <ContentContainer>
          <Image
            style={{ height: 120, width: Dimensions.get("window").width }}
            source={require("../../../img/logo.png")}
          />
          <Image
            style={{ height: 150, width: 150 }}
            source={require("../../../img/pushNotifications.png")}
          />
          <Title label={t("pushNotifications")} />
          <Text content={t("description")} />
          <Button
            enabled={true}
            primary={true}
            label={t("common:button:no")}
            onPress={this._onNext}
          />
          <Button
            enabled={true}
            primary={true}
            label={t("common:button:yes")}
            onPress={this._onNext}
          />
        </ContentContainer>
      </ScreenContainer>
    );
  }
}

export default withNamespaces("pushNotificationsScreen")<Props>(
  PushNotificationsScreen
);
