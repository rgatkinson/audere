import React from "react";
import { Alert } from "react-native";
import { NavigationScreenProp } from "react-navigation";
import { WithNamespaces, withNamespaces } from "react-i18next";
import reduxWriter, { ReduxWriterProps } from "../../../store/ReduxWriter";
import { AgeBucketConfig } from "./AgeScreen";
import { BloodConfig } from "./BloodScreen";
import Button from "../../components/Button";
import ContentContainer from "../../components/ContentContainer";
import Description from "../../components/Description";
import OptionList, { newSelectedOptionsMap } from "../../components/OptionList";
import ScreenContainer from "../../components/ScreenContainer";
import StatusBar from "../../components/StatusBar";
import Title from "../../components/Title";

interface Props {
  navigation: NavigationScreenProp<any, any>;
}

export const SymptomsConfig = {
  id: 'Symptoms',
  title: '3. What symptoms have you experienced in the last week?',
  description: 'Please select all that apply.',
  optionList: {
    options: [
      "feelingFeverish",
      "headaches",
      "cough",
      "diarrhea",
      "soreThroat",
      "nauseaOrVomiting",
      "runnyOrStuffyNose",
      "rash",
      "fatigue",
      "muscleOrBodyAches",
      "increasedTroubleBreathing",
      "earPainOrDischarge",
    ],
    multiSelect: true,
  },
  buttons: [
    { key: "done", primary: true },
    { key: "noneOfTheAbove", primary: false },
  ],
}

class SymptomsScreen extends React.PureComponent<Props & WithNamespaces & ReduxWriterProps> {
  _onDone = () => {
    if (this._numSymptoms() > 1) {
      if (this.props.getAnswer("selectedButtonKey", AgeBucketConfig.id) === "18orOver") {
        this.props.navigation.push("Blood", { data: BloodConfig });
      } else {
        this.props.navigation.push("Consent");
      }
    } else {
      Alert.alert(
        "Are you sure?",
        "You must have experienced at least 2 symptoms to participate in the study.",
        [
          {
            text: "Cancel",
            onPress: () => {},
          },
          { text: "Continue", onPress: () => {
              this.props.navigation.push("Inelligible");
            },
          },
        ]
      );
    }
  };

  _numSymptoms = () => {
    const symptoms: Map<string, boolean> = this.props.getAnswer("options");
    return symptoms
      ? Array.from(symptoms.values()).reduce(
          (count: number, value: boolean) => (value ? count + 1 : count),
          0
        )
      : 0;
  };

  render() {
    const { t } = this.props;
    return (
      <ScreenContainer>
        <StatusBar
          canProceed={this._numSymptoms() > 0}
          progressNumber="40%"
          progressLabel={t("common:statusBar:enrollment")}
          title="2. What is the age of the participant?"
          onBack={() => this.props.navigation.pop()}
          onForward={this._onDone}
        />
        <ContentContainer>
          <Title label={SymptomsConfig.title} />
          <Description content={SymptomsConfig.description} center={true} />
          <OptionList
            data={newSelectedOptionsMap(
              SymptomsConfig.optionList.options,
              this.props.getAnswer("options"),
            )}
            multiSelect={true}
            numColumns={2}
            onChange={symptoms => this.props.updateAnswer({ options: symptoms })}
          />
          {SymptomsConfig.buttons.map(button => (
            <Button
              checked={this.props.getAnswer("selectedButtonKey") === button.key}
              enabled={button.key === "done" ? this._numSymptoms() > 0 : true}
              key={button.key}
              label={t("surveyButton:" + button.key)}
              onPress={() => {
                if (button.key === "done") {
                  this.props.updateAnswer({ selectedButtonKey: button.key });
                  this._onDone();
                } else {
                  this.props.updateAnswer({ selectedButtonKey: button.key });
                  this.props.navigation.push("Inelligible");
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

export default reduxWriter(withNamespaces("symptomsScreen")(SymptomsScreen));
