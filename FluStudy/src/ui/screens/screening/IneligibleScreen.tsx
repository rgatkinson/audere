import React from "react";
import { Dimensions, Image } from "react-native";
import { NavigationScreenProp } from "react-navigation";
import { AgeConfig } from "../../../resources/ScreenConfig";
import Button from "../../components/Button";
import ContentContainer from "../../components/ContentContainer";
import Text from "../../components/Text";
import Title from "../../components/Title";
import ScreenContainer from "../../components/ScreenContainer";
import { WithNamespaces, withNamespaces } from "react-i18next";

interface Props {
  navigation: NavigationScreenProp<any, any>;
}

class IneligibleScreen extends React.Component<Props & WithNamespaces> {
  _onNext = () => {
    this.props.navigation.push("Welcome");
  };

  render() {
    const { t } = this.props;
    return (
      <ScreenContainer>
        <ContentContainer>
          <Image
            style={{ height: 120, width: Dimensions.get("window").width }}
            source={require("../../../img/logo.png")}
          />
          <Title size="small" label={t("ineligible")} />
          <Text content={t("description")} />
          <Text content={t("shareLink")} />
          <Text content={t("learnLink")} />
          <Text content={t("medLink")} />
          <Text content={t("disclaimer")} />
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

export default withNamespaces("ineligibleScreen")<Props>(IneligibleScreen);
