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
import { EnrolledConfig } from "../../../resources/ScreenConfig";
import { Action, Option, StoreState, setEmail } from "../../../store";
import Button from "../../components/Button";
import ContentContainer from "../../components/ContentContainer";
import Description from "../../components/Description";
import EmailInput from "../../components/EmailInput";
import OptionList, {
  emptyList,
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

interface State {
  email?: string;
}

@connect((state: StoreState) => ({
  email: state.form!.email,
}))
class EnrolledScreen extends React.PureComponent<
  Props & WithNamespaces & ReduxWriterProps, State
> {
  state: State = {};

  _onDone = () => {
    if (!!this.state.email) {
      this.props.dispatch(setEmail(this.state.email));
    }
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

  _getEmail = (): string => {
    return typeof this.state.email !== 'undefined' ? this.state.email : this.props.email;
  }

  _getSelectedOptions = (): Option[] => {
    const storedAnswer = this.props.getAnswer("options");
    if (storedAnswer == null) {
      const list = emptyList(EnrolledConfig.optionList!.options);
      const options = list.map(option => {
        if (!!EnrolledConfig.optionList!.defaultOptions!.find(key => key === option.key)) {
          return {
            key: option.key,
            selected: true,
          };
        }
        return option;
      });
      this.props.updateAnswer({ options });
      return options;
    }
    return storedAnswer;
  }

  render() {
    const { t } = this.props;
    return (
      <ScreenContainer>
        <SimpleStatusBar title={t("complete")} />
        <ContentContainer>
          <Title label={t("surveyTitle:" + EnrolledConfig.title)} />
          <Description
            content={t("surveyDescription:" + EnrolledConfig.description!.label)}
          />
          <OptionList
            data={newSelectedOptionsList(
              EnrolledConfig.optionList!.options,
              this._getSelectedOptions()
            )}
            multiSelect={true}
            numColumns={1}
            onChange={options => this.props.updateAnswer({ options })}
          />
          <EmailInput
            returnKeyType="done"
            value={this._getEmail()}
            onChange={text => this.setState({ email: text })}
            onSubmit={() => {}}
          />
          {EnrolledConfig.buttons.map(button => (
            <Button
              checked={this.props.getAnswer("selectedButtonKey") === button.key}
              enabled={
                button.key === "done"
                  ? !!this._getEmail() && this._haveEmailOption()
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
