import React from "react";
import { NavigationScreenProp } from "react-navigation";
import { WithNamespaces, withNamespaces } from "react-i18next";
import InfoScreen from "../../components/InfoScreen";
import Links from "../../components/Links";
import Text from "../../components/Text";

interface Props {
  navigation: NavigationScreenProp<any, any>;
}

class IneligibleScreen extends React.Component<Props & WithNamespaces> {
  render() {
    const { t } = this.props;
    return (
      <InfoScreen
        buttonLabel={t("returnHome")}
        imageSrc={require("../../../img/ineligible.png")}
        navBar={false}
        navigation={this.props.navigation}
        title={t("ineligible")}
        desc={t("description")}
        onNext={() => this.props.navigation.popToTop()}
      >
        <Links />
        <Text content={t("disclaimer")} small={true} />
      </InfoScreen>
    );
  }
}

export default withNamespaces("ineligibleScreen")<Props>(IneligibleScreen);
