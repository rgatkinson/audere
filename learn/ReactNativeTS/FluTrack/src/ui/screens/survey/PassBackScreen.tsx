import React from "react";
import { NavigationScreenProp } from "react-navigation";
import ContentContainer from "../../components/ContentContainer";
import ScreenContainer from "../../components/ScreenContainer";
import SimpleStatusBar from "../../components/SimpleStatusBar";
import Text from "../../components/Text";
import Title from "../../components/Title";
import { connect } from "react-redux";
import { Action, appendEvent } from "../../../store";
import { EventInfoKind } from "audere-lib/snifflesProtocol";
import { WithNamespaces, withNamespaces } from "react-i18next";

interface Props {
  dispatch(action: Action): void;
  navigation: NavigationScreenProp<any, any>;
}

@connect()
class PassBackScreen extends React.PureComponent<Props & WithNamespaces> {
  componentDidMount() {
    this.props.dispatch(
      appendEvent(EventInfoKind.Visit, "CompletedQuestionnaire")
    );
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
