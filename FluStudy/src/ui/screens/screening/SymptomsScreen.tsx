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
import { Option } from "../../../store";
import { SymptomsConfig } from "../../../resources/ScreenConfig";
import Button from "../../components/Button";
import ContentContainer from "../../components/ContentContainer";
import NavigationBar from "../../components/NavigationBar";
import OptionList, {
  newSelectedOptionsList,
} from "../../components/OptionList";
import ScreenContainer from "../../components/ScreenContainer";
import Step from "../../components/Step";
import Text from "../../components/Text";
import Title from "../../components/Title";

interface Props {
  navigation: NavigationScreenProp<any, any>;
}

@connect()
class SymptomsScreen extends React.PureComponent<
  Props & WithNamespaces & ReduxWriterProps
> {
  _onDone = () => {
    const { t } = this.props;
    this.props.updateAnswer({ selectedButtonKey: "next" });
    if (this._numSymptoms() > 1) {
      Alert.alert(t("thankYou"), t("nextStep"), [
        {
          text: t("headerBar:continue"),
          onPress: () => {
            this.props.navigation.push("Consent");
          },
        },
      ]);
    } else {
      Alert.alert(t("areYouSure"), t("minSymptoms"), [
        {
          text: t("headerBar:cancel"),
          onPress: () => {},
        },
        {
          text: t("headerBar:continue"),
          onPress: () => {
            this.props.navigation.push("Ineligible");
          },
        },
      ]);
    }
  };

  _haveOption = () => {
    const symptoms: Option[] = this.props.getAnswer("options");
    return symptoms
      ? symptoms.reduce(
          (result: boolean, option: Option) => result || option.selected,
          false
        )
      : false;
  };

  _numSymptoms = () => {
    const symptoms: Option[] = this.props.getAnswer("options");
    return symptoms
      ? symptoms.reduce(
          (count: number, option: Option) =>
            option.selected && option.key !== "noneOfTheAbove"
              ? count + 1
              : count,
          0
        )
      : 0;
  };

  render() {
    const { t } = this.props;
    return (
      <ScreenContainer>
        <NavigationBar
          canProceed={this._haveOption()}
          navigation={this.props.navigation}
          onNext={this._onDone}
        />
        <ContentContainer>
          <Step step={2} totalSteps={5} />
          <Title
            label={t("surveyTitle:" + SymptomsConfig.title)}
            size="small"
          />
          <Text
            content={t(
              "surveyDescription:" + SymptomsConfig.description!.label
            )}
            center={true}
          />
          <OptionList
            data={newSelectedOptionsList(
              SymptomsConfig.optionList!.options,
              this.props.getAnswer("options")
            )}
            multiSelect={true}
            numColumns={1}
            exclusiveOption="noneOfTheAbove"
            onChange={symptoms =>
              this.props.updateAnswer({ options: symptoms })
            }
          />
          <Button
            enabled={this._haveOption()}
            label={t("surveyButton:next")}
            onPress={this._onDone}
            primary={true}
          />
        </ContentContainer>
      </ScreenContainer>
    );
  }
}

export default reduxWriter(withNamespaces("symptomsScreen")(SymptomsScreen));
