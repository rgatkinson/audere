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

class ConfirmationScreen extends React.Component<Props & WithNamespaces> {
  _onNext = () => {
    this.props.navigation.push("PushNotifications");
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
            style={{ height: 150, width: 200 }}
            source={require("../../../img/confirmation.png")}
          />
          <Title label={t("confirmed")} />
          <Text content={t("description")} />
          <Button
            enabled={true}
            primary={true}
            label={t("common:button:next")}
            onPress={this._onNext}
          />
        </ContentContainer>
      </ScreenContainer>
    );
  }
}

export default withNamespaces("confirmationScreen")<Props>(ConfirmationScreen);
