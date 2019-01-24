import React from "react";
import { NavigationScreenProp } from "react-navigation";
import Button from "../../components/Button";
import ContentContainer from "../../components/ContentContainer";
import ScreenContainer from "../../components/ScreenContainer";
import Title from "../../components/Title";
import Text from "../../components/Text";
import { connect } from "react-redux";
import { Action, appendEvent } from "../../../store";
import { EventInfoKind } from "audere-lib";
import { WithNamespaces, withNamespaces } from "react-i18next";

interface Props {
  dispatch(action: Action): void;
  navigation: NavigationScreenProp<any, any>;
}

@connect()
class SurveyStartScreen extends React.Component<Props & WithNamespaces> {
  componentDidMount() {
    this.props.dispatch(appendEvent(EventInfoKind.Visit, "Enrolled"));
  }
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
