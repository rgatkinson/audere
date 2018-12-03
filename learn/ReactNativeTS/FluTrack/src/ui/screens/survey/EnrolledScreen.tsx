import React from "react";
import { StyleSheet, Text, View } from "react-native";
import { WithNamespaces, withNamespaces } from "react-i18next";
import { NavigationScreenProp } from "react-navigation";
import { connect } from "react-redux";
import reduxWriter, { ReduxWriterProps } from "../../../store/ReduxWriter";
import { Action, StoreState, setEmail } from "../../../store";
import Button from "../../components/Button";
import ContentContainer from "../../components/ContentContainer";
import Description from "../../components/Description";
import EmailInput from "../../components/EmailInput";
import OptionList, { newSelectedOptionsMap } from "../../components/OptionList";
import ScreenContainer from "../../components/ScreenContainer";
import SimpleStatusBar from "../../components/SimpleStatusBar";
import Title from "../../components/Title";

interface Props {
  dispatch(action: Action): void;
  email: string;
  options: Map<string, boolean>;
  navigation: NavigationScreenProp<any, any>;
}

export const EnrolledConfig = {
  id: 'Enrolled',
  title: "We would like to email you.",
  description: "Please select when we may email you, and provide your email address (optional).",
  optionList: {
    options: [
      "sendCopyOfMyConsent",
      "askAboutMyIllness",
      "learnAboutStudy",
      "allOfTheAbove",
    ],
    multiSelect: true,
  },
  buttons: [
    { key: "done", primary: true },
    { key: "doNotEmailMe", primary: false },
  ],
}

@connect((state: StoreState) => ({
  email: state.form!.email,
}))
class EnrolledScreen extends React.PureComponent<Props & WithNamespaces & ReduxWriterProps> {
  _onDone = () => {
    this.props.navigation.push("SurveyStart");
  };

  _haveEmailOption = () => {
    const options: Map<string, boolean> = this.props.getAnswer("options");
    return options && Array.from(options.values()).reduce(
        (result: boolean, value: boolean) => (result || value),
        false
      );
  };

  render() {
    const { t } = this.props;
    return (
      <ScreenContainer>
        <SimpleStatusBar title={t("complete")} />
        <ContentContainer>
          <Title label={EnrolledConfig.title} />
          <Description content={EnrolledConfig.description} />
          <OptionList
            data={newSelectedOptionsMap(
              EnrolledConfig.optionList.options,
              this.props.getAnswer("options"),
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
              enabled={button.key === "done" ? (!!this.props.email && this._haveEmailOption()) : true}
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
