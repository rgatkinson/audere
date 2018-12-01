import React from "react";
import { NavigationScreenProp } from "react-navigation";
import { AgeBucketConfig } from "./AgeScreen";
import Button from "../../components/Button";
import ContentContainer from "../../components/ContentContainer";
import Description from "../../components/Description";
import Title from "../../components/Title";
import ScreenContainer from "../../components/ScreenContainer";
import { WithNamespaces, withNamespaces } from "react-i18next";

interface Props {
  navigation: NavigationScreenProp<any, any>;
}

class WelcomeScreen extends React.Component<Props & WithNamespaces> {
  _onNext = () => {
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
            onPress={() => {
              this.props.navigation.push("Age", { data: AgeBucketConfig });
            }}
          />
        </ContentContainer>
      </ScreenContainer>
    );
  }
}

export default withNamespaces("welcomeScreen")<Props>(WelcomeScreen);
