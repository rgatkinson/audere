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

interface Props {
  admin: string;
  dispatch(action: Action): void;
  location: string;
  navigation: NavigationScreenProp<any, any>;
}

@connect((state: StoreState) => ({
  admin: state.admin.administrator,
  location: state.admin.location,
}))
class WelcomeScreen extends React.Component<Props & WithNamespaces> {
  _onNext = () => {
    this.props.dispatch(completeSurvey());
    this.props.dispatch(startForm(this.props.admin, this.props.location));
    this.props.navigation.push("Age", { data: AgeBucketConfig });
  };

  render() {
    const { t } = this.props;
    return (
      <ScreenContainer>
        <ContentContainer>
          <Title size="large" label={t("welcomeTo")} />
          <Text content={t("theGoal")} />
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
