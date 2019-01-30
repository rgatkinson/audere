import React from "react";
import { Dimensions, Image } from "react-native";
import { NavigationScreenProp } from "react-navigation";
import Button from "../../components/Button";
import ContentContainer from "../../components/ContentContainer";
import Links from "../../components/Links";
import NavigationBar from "../../components/NavigationBar";
import Text from "../../components/Text";
import Title from "../../components/Title";
import ScreenContainer from "../../components/ScreenContainer";
import { WithNamespaces, withNamespaces } from "react-i18next";

interface Props {
  navigation: NavigationScreenProp<any, any>;
}

class ExtraInfoScreen extends React.Component<Props & WithNamespaces> {
  _onNext = () => {
    this.props.navigation.push("Welcome");
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
            source={require("../../../img/extraInfo.png")}
          />
          <Title label={t("extraInfo")} />
          <Links />
          <Button
            enabled={true}
            primary={true}
            label={t("close")}
            onPress={this._onNext}
          />
        </ContentContainer>
      </ScreenContainer>
    );
  }
}

export default withNamespaces("extraInfoScreen")<Props>(ExtraInfoScreen);
