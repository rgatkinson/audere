import React from "react";
import { NavigationScreenProp } from "react-navigation";
import { connect } from "react-redux";
import { Action, completeSurvey, startForm, StoreState } from "../../../store";
import { AgeBucketConfig } from "../../../resources/ScreenConfig";
import Button from "../../components/Button";
import ContentContainer from "../../components/ContentContainer";
import Text from "../../components/Text";
import Title from "../../components/Title";
import ScreenContainer from "../../components/ScreenContainer";
import { WithNamespaces, withNamespaces } from "react-i18next";
import { SpawnSyncOptionsWithStringEncoding } from "child_process";

interface Props {
  admin: string;
  dispatch(action: Action): void;
  isDemo: boolean;
  location: string;
  locationType: string;
  navigation: NavigationScreenProp<any, any>;
}

@connect((state: StoreState) => ({
  admin: state.admin.administrator,
  isDemo: !!state.admin.isDemo,
  location: state.admin.location,
  locationType: state.admin.locationType,
}))
class WelcomeScreen extends React.Component<Props & WithNamespaces> {
  _onNext = () => {
    this.props.dispatch(completeSurvey());
    this.props.dispatch(
      startForm(this.props.admin, this.props.location, this.props.isDemo)
    );
    this.props.navigation.push("Age", { data: AgeBucketConfig });
  };

  render() {
    const { t, locationType } = this.props;
    return (
      <ScreenContainer>
        <ContentContainer>
          <Title size="large" label={t("welcomeTo")} />
          {locationType !== "port" && <Text content={t("theGoal")} />}
          <Text content={t("participationRequirements")} />
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
