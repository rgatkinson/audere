import React from "react";
import { NavigationScreenProp } from "react-navigation";
import { connect } from "react-redux";
import { Action, completeSurvey, startForm } from "../../../store";
import { AgeBucketConfig } from "./AgeScreen";
import Button from "../../components/Button";
import ContentContainer from "../../components/ContentContainer";
import Description from "../../components/Description";
import Title from "../../components/Title";
import ScreenContainer from "../../components/ScreenContainer";
import { WithNamespaces, withNamespaces } from "react-i18next";

interface Props {
  dispatch(action: Action): void;
  navigation: NavigationScreenProp<any, any>;
}

@connect()
class WelcomeScreen extends React.Component<Props & WithNamespaces> {
  _onNext = () => {
    this.props.dispatch(completeSurvey());
    this.props.dispatch(startForm());
    this.props.navigation.push("Age", { data: AgeBucketConfig });
  };

  render() {
    const { t } = this.props;
    return (
      <ScreenContainer>
        <ContentContainer>
          <Title size="large" label={t("welcomeTo")} />
          <Description content={t("theGoal")} />
          <Button
            enabled={true}
            primary={true}
            label={t("common:button:getStarted")}
            onPress={this._onNext}
          />
        </ContentContainer>
      </ScreenContainer>
    );
  }
}

export default withNamespaces("welcomeScreen")<Props>(WelcomeScreen);
