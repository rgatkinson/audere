import React from "react";
import { NavigationScreenProp } from "react-navigation";
import ContentContainer from "../../components/ContentContainer";
import ScreenContainer from "../../components/ScreenContainer";
import SimpleStatusBar from "../../components/SimpleStatusBar";
import Text from "../../components/Text";
import Title from "../../components/Title";
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
class PassBackScreen extends React.PureComponent<Props & WithNamespaces> {
  componentDidMount() {
    const events = !!this.props.events ? this.props.events.slice(0) : [];
    events.push({
      kind: EventInfoKind.Visit,
      at: new Date().toISOString(),
      refId: "COMPLETED_QUESTIONNAIRE",
    });
    this.props.dispatch(setEvents(events));
  }
  render() {
    const { t } = this.props;
    return (
      <ScreenContainer>
        <SimpleStatusBar title={t("complete")} />
        <ContentContainer>
          <Title label={t("pleaseReturn")} />
          <Text content={t("theyWillAssist")} />
        </ContentContainer>
      </ScreenContainer>
    );
  }
}

export default withNamespaces("passBackScreen")<Props>(PassBackScreen);
