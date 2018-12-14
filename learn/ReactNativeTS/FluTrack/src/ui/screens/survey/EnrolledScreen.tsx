// Copyright (c) 2018 by Audere
//
// Use of this source code is governed by an MIT-style license that
// can be found in the LICENSE file distributed with this file.

import React from "react";
import { StyleSheet, Text, View } from "react-native";
import { WithNamespaces, withNamespaces } from "react-i18next";
import { NavigationScreenProp } from "react-navigation";
import { connect } from "react-redux";
import reduxWriter, { ReduxWriterProps } from "../../../store/ReduxWriter";
import { Action, Option, StoreState, setEmail } from "../../../store";
import Button from "../../components/Button";
import ContentContainer from "../../components/ContentContainer";
import Description from "../../components/Description";
import EmailInput from "../../components/EmailInput";
import OptionList, {
  newSelectedOptionsList,
} from "../../components/OptionList";
import ScreenContainer from "../../components/ScreenContainer";
import SimpleStatusBar from "../../components/SimpleStatusBar";
import Title from "../../components/Title";

interface Props {
  dispatch(action: Action): void;
  email: string;
  options: Option[];
  navigation: NavigationScreenProp<any, any>;
}

export const EnrolledConfig = {
  id: "Enrolled",
  title: "enrolledTitle",
  description: {
    label: "enrolledDescription",
  },
  optionList: {
    options: ["askAboutMyIllness", "learnAboutStudy", "allOfTheAbove"],
    multiSelect: true,
  },
  buttons: [
    { key: "done", primary: true },
    { key: "doNotEmailMe", primary: false },
  ],
};

@connect((state: StoreState) => ({
  email: state.form!.email,
}))
class EnrolledScreen extends React.PureComponent<
  Props & WithNamespaces & ReduxWriterProps
> {
  _onDone = () => {
    this.props.navigation.push("SurveyStart");
  };

  _haveEmailOption = () => {
    const options: Option[] = this.props.getAnswer("options");
    return (
      options &&
      options.reduce(
        (result: boolean, option: Option) => result || option.selected,
        false
      )
    );
  };

  render() {
    const { t } = this.props;
    return (
      <ScreenContainer>
        <SimpleStatusBar title={t("complete")} />
        <ContentContainer>
          <Title label={t("surveyTitle:" + EnrolledConfig.title)} />
          <Description
            content={t("surveyDescription:" + EnrolledConfig.description.label)}
          />
          <OptionList
            data={newSelectedOptionsList(
              EnrolledConfig.optionList.options,
              this.props.getAnswer("options")
            )}
            multiSelect={true}
            numColumns={1}
            onChange={options => this.props.updateAnswer({ options })}
          />
          <EmailInput
            returnKeyType="done"
            value={this.props.email && this.props.email}
            onChange={text => this.props.dispatch(setEmail(text))}
            onSubmit={() => {}}
          />
          {EnrolledConfig.buttons.map(button => (
            <Button
              checked={this.props.getAnswer("selectedButtonKey") === button.key}
              enabled={
                button.key === "done"
                  ? !!this.props.email && this._haveEmailOption()
                  : true
              }
              key={button.key}
              label={t("surveyButton:" + button.key)}
              primary={button.primary}
              onPress={() => {
                this.props.updateAnswer({ selectedButtonKey: button.key });
                this._onDone();
              }}
            />
          ))}
        </ContentContainer>
      </ScreenContainer>
    );
  }
}

export default reduxWriter(withNamespaces("enrolledScreen")(EnrolledScreen));
