import React from "react";
import { Alert } from "react-native";
import { WithNamespaces, withNamespaces } from "react-i18next";
import { NavigationScreenProp } from "react-navigation";
import reduxWriter, { ReduxWriterProps } from "../../../store/ReduxWriter";
import { BloodConfig } from "./BloodScreen";
import Button from "../../components/Button";
import ContentContainer from "../../components/ContentContainer";
import Description from "../../components/Description";
import ScreenContainer from "../../components/ScreenContainer";
import StatusBar from "../../components/StatusBar";
import Title from "../../components/Title";

interface Props {
  navigation: NavigationScreenProp<any, any>;
}

export const SwabConfig = {
  id: 'SwabScreen',
  title: "4. Would you like to take part in an extra part of the study?",
  description: "There is an extra part of the study. You have the choice to join this extra part. If you join this extra part, 2 nasal swabs would be collected from you. One collected by research staff. One collected by you.",
  buttons: [
    {
      key: "yes",
      primary: true,
      subtext: "I understand I will have 2 nasal swabs collected. One by me and the other by research staff."
    },
    {
      key: "no",
      primary: true,
      subtext: "I only want 1 nasal swab."
    },
    { key: "noSwabs", primary: false },
  ],
}

class SwabScreen extends React.Component<Props & WithNamespaces & ReduxWriterProps> {
  _onNext = () => {
    this.props.navigation.push("Blood", { data: BloodConfig });
  };

  _onNone = () => {
    Alert.alert(
      "Exit Survey?",
      "At least 1 nasal swab is required to participate in the study.",
      [
        {
          text: "Exit",
          onPress: () => {
            this.props.navigation.push("Inelligible");
          },
          style: "destructive",
        },
        { text: "Continue", onPress: () => {} },
      ]
    );
  };

  render() {
    const { t } = this.props;
    return (
      <ScreenContainer>
        <StatusBar
          canProceed={!!this.props.getAnswer("selectedButtonKey")}
          progressNumber="60%"
          progressLabel="Enrollment"
          title="3. What symptoms have you experienced in..."
          onBack={() => this.props.navigation.pop()}
          onForward={() => {
            if (this.props.getAnswer("selectedButtonKey") === "noSwabs") {
              this._onNone();
            } else {
              this._onNext();
            }
          }}
        />
        <ContentContainer>
          <Title label={SwabConfig.title} />
          <Description content={SwabConfig.description} />
          {SwabConfig.buttons.map(button => (
            <Button
              checked={this.props.getAnswer("selectedButtonKey") === button.key}
              enabled={true}
              key={button.key}
              label={t("surveyButton:" + button.key)}
              subtext={button.subtext}
              onPress={() => {
                this.props.updateAnswer({ selectedButtonKey: button.key });
                if (button.key === "noSwabs") {
                  this._onNone();
                } else {
                  this._onNext();
                }
              }}
              primary={button.primary}
            />
          ))}
        </ContentContainer>
      </ScreenContainer>
    );
  }
}

export default reduxWriter(withNamespaces()(SwabScreen));
