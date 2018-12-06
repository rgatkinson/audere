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
  title: "4. Would you like to take part in a blood collection?",
  description: {
    label: "You have the choice to join an extra part of the study. If you join this extra part, we would collect a blood sample from you. To do this, we would poke your skin to collect blood from your vein.",
  },
  buttons: [
    {
      key: "yes",
      primary: true,
      subtext: "I would like to join the extra part of the study. I understand I will have my blood collected."
    },
    {
      key: "no",
      primary: true,
      subtext: "I do not want any blood collected from me."
    },
  ],
}

class BloodScreen extends React.Component<Props & WithNamespaces & ReduxWriterProps> {
  _onDone = () => {
    this.props.navigation.push("Consent", { data: ConsentConfig, priorTitle: BloodConfig.title});
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
          <Title label={BloodConfig.title} />
          <Description content={BloodConfig.description.label} />
          {BloodConfig.buttons.map(button => (
            <Button
              checked={this.props.getAnswer("selectedButtonKey") === button.key}
              enabled={true}
              key={button.key}
              label={t("surveyButton:" + button.key)}
              subtext={button.subtext}
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
