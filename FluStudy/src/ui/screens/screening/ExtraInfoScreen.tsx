import React from "react";
import { NavigationScreenProp } from "react-navigation";
import { WithNamespaces, withNamespaces } from "react-i18next";
import InfoScreen from "../../components/InfoScreen";
import Links from "../../components/Links";

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
      <InfoScreen
        buttonLabel={t("close")}
        imageSrc={require("../../../img/extraInfo.png")}
        navBar={true}
        navigation={this.props.navigation}
        title={t("extraInfo")}
        onNext={this._onNext}
      >
        <Links />
      </InfoScreen>
    );
  }
}

export default withNamespaces("extraInfoScreen")<Props>(ExtraInfoScreen);
