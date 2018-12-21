import React from "react";
import { NavigationScreenProp } from "react-navigation";
import Button from "../../components/Button";
import ContentContainer from "../../components/ContentContainer";
import Description from "../../components/Description";
import Title from "../../components/Title";
import ScreenContainer from "../../components/ScreenContainer";
import { WithNamespaces, withNamespaces } from "react-i18next";

interface Props {
  navigation: NavigationScreenProp<any, any>;
}

class PaperConsentScreen extends React.Component<Props & WithNamespaces> {
  render() {
    const { t } = this.props;
    return (
      <ScreenContainer>
        <ContentContainer>
          <Title label={t("getACopy")} />
          <Description content={t("paperConsent")} />
          <Button
            enabled={true}
            primary={true}
            label={t("common:button:done")}
            onPress={() => this.props.navigation.push("SurveyStart")}
          />
        </ContentContainer>
      </ScreenContainer>
    );
  }
}

export default withNamespaces("paperConsentScreen")<Props>(PaperConsentScreen);
