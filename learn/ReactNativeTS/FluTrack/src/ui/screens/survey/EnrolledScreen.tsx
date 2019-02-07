// Copyright (c) 2018 by Audere
//
// Use of this source code is governed by an MIT-style license that
// can be found in the LICENSE file distributed with this file.

import React from "react";
import { StyleSheet } from "react-native";
import { WithNamespaces, withNamespaces } from "react-i18next";
import { NavigationScreenProp } from "react-navigation";
import { connect } from "react-redux";
import reduxWriter, { ReduxWriterProps } from "../../../store/ReduxWriter";
import { EnrolledConfig } from "../../../resources/ScreenConfig";
import { Action, Option, StoreState, setEmail } from "../../../store";
import Button from "../../components/Button";
import ContentContainer from "../../components/ContentContainer";
import EmailInput from "../../components/EmailInput";
import OptionList, {
  emptyList,
  newSelectedOptionsList,
} from "../../components/OptionList";
import ScreenContainer from "../../components/ScreenContainer";
import StatusBar from "../../components/StatusBar";
import Text from "../../components/Text";
import Title from "../../components/Title";

interface Props {
  dispatch(action: Action): void;
  email: string;
  navigation: NavigationScreenProp<any, any>;
}

interface State {
  email?: string;
  options: Option[];
  valid: boolean;
}

@connect((state: StoreState) => ({
  email: state.form!.email,
}))
class EnrolledScreen extends React.PureComponent<
  Props & WithNamespaces & ReduxWriterProps,
  State
> {
  constructor(props: Props & WithNamespaces & ReduxWriterProps) {
    super(props);
    const storedAnswer = props.getAnswer("options");
    if (storedAnswer == null) {
      const list = emptyList(EnrolledConfig.optionList!.options);
      const options = list.map(option => {
        if (
          !!EnrolledConfig.optionList!.defaultOptions!.find(
            key => key === option.key
          )
        ) {
          return {
            key: option.key,
            selected: true,
          };
        }
        return option;
      });
      this.state = { options, email: props.email, valid: !!props.email };
    } else {
      this.state = {
        options: storedAnswer,
        email: props.email,
        valid: !!props.email,
      };
    }
  }

  _validEmail = () => {
    return (
      !!this.state.email &&
      this.state.valid &&
      !!this.state.options &&
      this.state.options.reduce(
        (result: boolean, option: Option) => result || option.selected,
        false
      )
    );
  };

  _onDone = (buttonKey: string) => {
    if (!!this.state.email) {
      this.props.dispatch(setEmail(this.state.email));
    }
    this.props.updateAnswer({ options: this.state.options });
    this._proceed(buttonKey);
  };

  _proceed = (buttonKey: string) => {
    if (buttonKey === "done" && this._receiveConsent()) {
      this.props.navigation.push("SurveyStart");
    } else {
      this.props.navigation.push("PaperConsent");
    }
  };

  _receiveConsent = () => {
    return (
      !!this.state.email &&
      !!this.state.options &&
      this.state.options.reduce(
        (result: boolean, option: Option) =>
          result ||
          (option.selected &&
            (option.key === "sendCopyOfMyConsent" ||
              option.key === "allOfTheAbove")),
        false
      )
    );
  };

  _canProceed = (): boolean => {
    const selectedButtonKey = this.props.getAnswer("selectedButtonKey");
    return (
      !!selectedButtonKey &&
      (selectedButtonKey !== "done" || this._validEmail())
    );
  };

  render() {
    const { t } = this.props;
    return (
      <ScreenContainer>
        <StatusBar
          canProceed={this._canProceed()}
          progressNumber="95%"
          progressLabel={t("common:statusBar:enrollment")}
          title={t("contactInfo")}
          onBack={() => this.props.navigation.pop()}
          onForward={() => {
            this._proceed(this.props.getAnswer("selectedButtonKey"));
          }}
        />
        <ContentContainer>
          <Title label={t("surveyTitle:" + EnrolledConfig.title)} />
          <Text
            content={t(
              "surveyDescription:" + EnrolledConfig.description!.label
            )}
          />
          <EmailInput
            autoFocus={true}
            placeholder={t("emailAddress")}
            returnKeyType="next"
            validationError={t("validationError")}
            value={this.state.email}
            onChange={(email, valid) => this.setState({ email, valid })}
            onSubmit={valid => this.setState({ valid })}
          />
          <Text content={t("disclaimer")} style={styles.disclaimer} />
          <OptionList
            data={this.state.options}
            multiSelect={true}
            numColumns={1}
            onChange={options => this.setState({ options })}
            inclusiveOption={EnrolledConfig.optionList!.inclusiveOption}
          />
          {EnrolledConfig.buttons.map(button => (
            <Button
              checked={this.props.getAnswer("selectedButtonKey") === button.key}
              enabled={button.key === "done" ? this._validEmail() : true}
              key={button.key}
              label={t("surveyButton:" + button.key)}
              primary={button.primary}
              onPress={() => {
                this.props.updateAnswer({ selectedButtonKey: button.key });
                this._onDone(button.key);
              }}
            />
          ))}
        </ContentContainer>
      </ScreenContainer>
    );
  }
}

const styles = StyleSheet.create({
  disclaimer: {
    fontSize: 17,
    marginTop: 20,
  },
});

export default reduxWriter(withNamespaces("enrolledScreen")(EnrolledScreen));
