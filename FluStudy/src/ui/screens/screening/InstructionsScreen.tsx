import React from "react";
import { NavigationScreenProp } from "react-navigation";
import { WithNamespaces, withNamespaces } from "react-i18next";
import InfoScreen from "../../components/InfoScreen";

interface Props {
  navigation: NavigationScreenProp<any, any>;
}

class InstructionsScreen extends React.Component<Props & WithNamespaces> {
  _onNext = () => {
    this.props.navigation.push("ExtraInfo");
  };

  render() {
    const { t } = this.props;
    return (
      <InfoScreen
        desc={t("description")}
        imageSrc={require("../../../img/instructions.png")}
        navBar={true}
        navigation={this.props.navigation}
        title={t("instructions")}
        onNext={this._onNext}
      />
    );
  }
}

export default withNamespaces("instructionsScreen")<Props>(InstructionsScreen);
