import React from "react";
import { NavigationScreenProp } from "react-navigation";
import Button from "../../components/Button";
import ContentContainer from "../../components/ContentContainer";
import ScreenContainer from "../../components/ScreenContainer";
import Title from "../../components/Title";
import Text from "../../components/Text";
import { connect } from "react-redux";
import { Action, setEvents, StoreState } from "../../../store";
import { EventInfo, EventInfoKind } from "audere-lib";
import { WithNamespaces, withNamespaces } from "react-i18next";

interface Props {
  events: EventInfo[];
  dispatch(action: Action): void;
  navigation: NavigationScreenProp<any, any>;
}

@connect((state: StoreState) => ({
  events: state.form.events,
}))
class SurveyStartScreen extends React.Component<Props & WithNamespaces> {
  componentDidMount() {
    const events = !!this.props.events ? this.props.events.slice(0) : [];
    events.push({
      kind: EventInfoKind.Visit,
      at: new Date().toISOString(),
      refId: "ENROLLED",
    });
    this.props.dispatch(setEvents(events));
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
