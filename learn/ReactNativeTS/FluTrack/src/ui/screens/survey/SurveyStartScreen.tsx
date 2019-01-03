import React from "react";
import { NavigationScreenProp } from "react-navigation";
import Button from "../../components/Button";
import ContentContainer from "../../components/ContentContainer";
import ScreenContainer from "../../components/ScreenContainer";
import Title from "../../components/Title";
import Text from "../../components/Text";
import { WithNamespaces, withNamespaces } from "react-i18next";

interface Props {
  navigation: NavigationScreenProp<any, any>;
}

class SurveyStartScreen extends React.Component<Props & WithNamespaces> {
  render() {
    const { t } = this.props;
    return (
      <ScreenContainer>
        <ContentContainer>
          <Title label={t("common:statusBar:studyQuestionnaire")} />
          <Text content={t("youAreNowEnrolled")} />
          <Button
            enabled={true}
            primary={true}
            label={t("common:button:getStarted")}
            onPress={() => this.props.navigation.push("Survey")}
          />
        </ContentContainer>
      </ScreenContainer>
    );
  }
}

export default withNamespaces("surveyStartScreen")<Props>(SurveyStartScreen);
