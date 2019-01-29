import React from "react";
import { WithNamespaces, withNamespaces } from "react-i18next";
import { NavigationScreenProp } from "react-navigation";
import reduxWriter, { ReduxWriterProps } from "../../../store/ReduxWriter";
import { AgeConfig, SymptomsConfig } from "../../../resources/ScreenConfig";
import Button from "../../components/Button";
import ContentContainer from "../../components/ContentContainer";
import NavigationBar from "../../components/NavigationBar";
import ScreenContainer from "../../components/ScreenContainer";
import Step from "../../components/Step";
import Title from "../../components/Title";

interface Props {
  navigation: NavigationScreenProp<any, any>;
}

class AgeScreen extends React.Component<
  Props & WithNamespaces & ReduxWriterProps
> {
  _onDone = () => {
    this.props.navigation.push("Symptoms", { data: SymptomsConfig });
  };

  render() {
    const { t } = this.props;
    return (
      <ScreenContainer>
        <NavigationBar
          canProceed={!!this.props.getAnswer("selectedButtonKey")}
          navigation={this.props.navigation}
          onNext={this._onDone}
        />
        <ContentContainer>
          <Step step={1} totalSteps={5} />
          <Title label={t("surveyTitle:" + AgeConfig.title)} size="small" />
          {AgeConfig.buttons.map(button => (
            <Button
              checked={this.props.getAnswer("selectedButtonKey") === button.key}
              enabled={true}
              key={button.key}
              label={t("surveyButton:" + button.key)}
              onPress={() => {
                this.props.updateAnswer({ selectedButtonKey: button.key });
                this._onDone();
              }}
              primary={button.primary}
            />
          ))}
        </ContentContainer>
      </ScreenContainer>
    );
  }
}

export default reduxWriter(withNamespaces("ageScreen")(AgeScreen));
