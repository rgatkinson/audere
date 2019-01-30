import React from "react";
import { NavigationScreenProp } from "react-navigation";
import { WithNamespaces, withNamespaces } from "react-i18next";
import InfoScreen from "../../components/InfoScreen";

interface Props {
  navigation: NavigationScreenProp<any, any>;
}

class WhyScreen extends React.Component<Props & WithNamespaces> {
  _onNext = () => {
    this.props.navigation.push("What");
  };

  render() {
    const { t } = this.props;
    return (
      <InfoScreen
        desc={t("description")}
        imageSrc={require("../../../img/why.png")}
        navBar={false}
        navigation={this.props.navigation}
        title={t("why")}
        onNext={this._onNext}
      />
    );
  }
}

export default withNamespaces("whyScreen")<Props>(WhyScreen);
