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

class WhatScreen extends React.Component<Props & WithNamespaces> {
  _onNext = () => {
    this.props.navigation.push("Age", { data: AgeConfig });
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
          <Title size="small" label={t("what")} />
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

export default withNamespaces("whatScreen")<Props>(WhatScreen);
