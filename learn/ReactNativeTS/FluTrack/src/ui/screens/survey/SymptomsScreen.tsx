// Copyright (c) 2018 by Audere
//
// Use of this source code is governed by an MIT-style license that
// can be found in the LICENSE file distributed with this file.

import React from "react";
import { Alert } from "react-native";
import { NavigationScreenProp } from "react-navigation";
import { WithNamespaces, withNamespaces } from "react-i18next";
import { connect } from "react-redux";
import reduxWriter, { ReduxWriterProps } from "../../../store/ReduxWriter";
import { Option, StoreState } from "../../../store";
import { AgeBucketConfig, BloodConfig, ConsentConfig, SymptomsConfig } from "../../../resources/ScreenConfig";
import Button from "../../components/Button";
import ContentContainer from "../../components/ContentContainer";
import Description from "../../components/Description";
import OptionList, {
  newSelectedOptionsList,
} from "../../components/OptionList";
import ScreenContainer from "../../components/ScreenContainer";
import StatusBar from "../../components/StatusBar";
import Title from "../../components/Title";

interface Props {
  bloodCollection: boolean;
  navigation: NavigationScreenProp<any, any>;
}

@connect((state: StoreState) => ({
  bloodCollection: state.admin.bloodCollection,
}))
class SymptomsScreen extends React.PureComponent<
  Props & WithNamespaces & ReduxWriterProps
> {
  _onDone = () => {
    const { t } = this.props;
    if (this._numSymptoms() > 1) {
      if (
        this.props.getAnswer("selectedButtonKey", AgeBucketConfig.id) ===
          "18orOver" &&
        this.props.bloodCollection
      ) {
        this.props.navigation.push("Blood", {
          data: BloodConfig,
          priorTitle: t("surveyTitle:" + SymptomsConfig.title),
        });
      } else {
        this.props.navigation.push("Consent", {
          data: ConsentConfig,
          priorTitle: t("surveyTitle:" + SymptomsConfig.title),
        });
      }
    } else {
      Alert.alert(t("areYouSure"), t("minSymptoms"), [
        {
          text: t("headerBar:cancel"),
          onPress: () => {},
        },
        {
          text: t("headerBar:continue"),
          onPress: () => {
            this.props.navigation.push("Inelligible");
          },
        },
      ]);
    }
  };

  _numSymptoms = () => {
    const symptoms: Option[] = this.props.getAnswer("options");
    return symptoms
      ? symptoms.reduce(
          (count: number, option: Option) =>
            option.selected ? count + 1 : count,
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
          title={this.props.navigation.getParam("priorTitle")}
          onBack={() => this.props.navigation.pop()}
          onForward={this._onDone}
        />
        <ContentContainer>
          <Title label={t("surveyTitle:" + SymptomsConfig.title)} />
          <Description
            content={t("surveyDescription:" + SymptomsConfig.description!.label)}
            center={true}
          />
          <OptionList
            data={newSelectedOptionsList(
              SymptomsConfig.optionList!.options,
              this.props.getAnswer("options")
            )}
            multiSelect={true}
            numColumns={2}
            onChange={symptoms =>
              this.props.updateAnswer({ options: symptoms })
            }
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
