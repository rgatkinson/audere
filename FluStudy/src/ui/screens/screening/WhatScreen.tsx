import React from "react";
import { NavigationScreenProp } from "react-navigation";
import { AgeConfig } from "../../../resources/ScreenConfig";
import { WithNamespaces, withNamespaces } from "react-i18next";
import InfoScreen from "../../components/InfoScreen";

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
      <InfoScreen
        imageSrc={require("../../../img/what.png")}
        navBar={false}
        navigation={this.props.navigation}
        title={t("what")}
        desc={t("description")}
        onNext={this._onNext}
      />
    );
  }
}

export default withNamespaces("whatScreen")<Props>(WhatScreen);
