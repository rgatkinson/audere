import React from "react";
import { WithNamespaces, withNamespaces } from "react-i18next";
import { NavigationScreenProp } from "react-navigation";
import reduxWriter, { ReduxWriterProps } from "../../../store/ReduxWriter";
import { ConsentConfig } from "./ConsentScreen";
import Button from "../../components/Button";
import ContentContainer from "../../components/ContentContainer";
import Description from "../../components/Description";
import ScreenContainer from "../../components/ScreenContainer";
import StatusBar from "../../components/StatusBar";
import Title from "../../components/Title";

interface Props {
  navigation: NavigationScreenProp<any, any>;
}

export const BloodConfig = {
  id: 'BloodScreen',
  title: 'bloodTitle',
  description: {
    label: 'bloodDescription',
  },
  buttons: [
    {
      key: "yes",
      primary: true,
      subtextKey: "yesBloodButtonSubtext",
    },
    {
      key: "no",
      primary: true,
      subtextKey: "noBloodButtonSubtext"
    },
  ],
}

class BloodScreen extends React.Component<Props & WithNamespaces & ReduxWriterProps> {
  _onDone = () => {
    this.props.navigation.push("Consent", { data: ConsentConfig, priorTitle: this.props.t("surveyTitle:" + BloodConfig.title) });
  };

  render() {
    const { t } = this.props;
    return (
      <ScreenContainer>
        <StatusBar
          canProceed={!!this.props.getAnswer("selectedButtonKey")}
          progressNumber="70%"
          progressLabel={t("common:statusBar:enrollment")}
          title={this.props.navigation.getParam("priorTitle")}
          onBack={() => this.props.navigation.pop()}
          onForward={this._onDone}
        />
        <ContentContainer>
          <Title label={t("surveyTitle:" + BloodConfig.title)} />
          <Description content={t("surveyDescription:" + BloodConfig.description.label)} />
          {BloodConfig.buttons.map(button => (
            <Button
              checked={this.props.getAnswer("selectedButtonKey") === button.key}
              enabled={true}
              key={button.key}
              label={t("surveyButton:" + button.key)}
              subtext={t(button.subtextKey)}
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

export default reduxWriter(withNamespaces("bloodScreen")(BloodScreen));
