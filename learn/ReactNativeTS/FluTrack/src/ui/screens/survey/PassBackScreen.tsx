import React from "react";
import { NavigationScreenProp } from "react-navigation";
import ContentContainer from "../../components/ContentContainer";
import Description from "../../components/Description";
import ScreenContainer from "../../components/ScreenContainer";
import SimpleStatusBar from "../../components/SimpleStatusBar";
import Title from "../../components/Title";
import { WithNamespaces, withNamespaces } from "react-i18next";

interface Props {
  navigation: NavigationScreenProp<any, any>;
}

class PassBackScreen extends React.PureComponent<Props & WithNamespaces> {
  render() {
    const { t } = this.props;
    return (
      <ScreenContainer>
        <SimpleStatusBar title={t("complete")} />
        <ContentContainer>
          <Title label={t("pleaseReturn")} />
          <Description content={t("theyWillAssist")} />
        </ContentContainer>
      </ScreenContainer>
    );
  }
}

export default withNamespaces("passBackScreen")<Props>(PassBackScreen);