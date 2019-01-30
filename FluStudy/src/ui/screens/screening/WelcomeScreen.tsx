import React from "react";
import { NavigationScreenProp } from "react-navigation";
import { connect } from "react-redux";
import { WithNamespaces, withNamespaces } from "react-i18next";
import { Action, startForm, StoreState } from "../../../store";
import InfoScreen from "../../components/InfoScreen";

interface Props {
  dispatch(action: Action): void;
  navigation: NavigationScreenProp<any, any>;
}

@connect()
class WelcomeScreen extends React.Component<Props & WithNamespaces> {
  _onNext = () => {
    this.props.dispatch(startForm());
    this.props.navigation.push("Why");
  };

  render() {
    const { t } = this.props;
    return (
      <InfoScreen
        imageSrc={require("../../../img/welcome.png")}
        navBar={false}
        title={t("welcome")}
        desc={t("description")}
        onNext={this._onNext}
      />
    );
  }
}

export default withNamespaces("welcomeScreen")<Props>(WelcomeScreen);
