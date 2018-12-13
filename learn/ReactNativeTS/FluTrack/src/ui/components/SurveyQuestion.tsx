import React, { Component } from "react";
import { View, StyleSheet, TouchableOpacity } from "react-native";
import { WithNamespaces, withNamespaces } from "react-i18next";
import { Action, Option } from "../../store/index";
import reduxWriter, { ReduxWriterProps } from "../../store/ReduxWriter";
import { ButtonConfig, EnabledOption, SurveyQuestionData } from "../../resources/QuestionnaireConfig";
import AddressInput from "./AddressInput";
import Button from "./Button";
import DateInput from "./DateInput";
import Description from "./Description";
import NumberInput from "./NumberInput";
import OptionList, { newSelectedOptionsList } from "./OptionList";
import TextInput from "./TextInput";
import Title from "./Title";

export interface SurveyQuestionProps {
  active: boolean;
  data: SurveyQuestionData;
  onActivate(): void;
  onNext(nextQuestion: string | null): void;
}

class SurveyQuestion extends Component<
  SurveyQuestionProps & WithNamespaces & ReduxWriterProps
> {
  _getNextQuestion = (selectedButtonKey: string): string | null => {
    let nextQuestion = this.props.data.nextQuestion;
    if (this.props.data.conditionalNext) {
      !!this.props.data.conditionalNext!.options &&
        !!this.props.getAnswer("options") &&
        this.props.getAnswer("options").forEach((value: boolean, key: string) => {
          if (value && this.props.data.conditionalNext!.options!.has(key)) {
            nextQuestion = this.props.data.conditionalNext!.options!.get(key)!;
          }
        });
      !!this.props.data.conditionalNext!.buttonKeys &&
        this.props.data.conditionalNext!.buttonKeys!.forEach((question: string, key: string) => {
          if (key === selectedButtonKey) {
            nextQuestion = question;
          }
        });
    }
    // TODO admin conditional next
    return nextQuestion === undefined ? null : nextQuestion;
  };

  _getButtonEnabled = (enabledStatus: EnabledOption): boolean => {
    if (enabledStatus === "withOption") {
      const options = this.props.getAnswer("options");
      return !!options && options.reduce((result: boolean, option: Option) => result || option.selected, false);
    } else if (enabledStatus === "withText") {
      return !!this.props.getAnswer("textInput");
    } else if (enabledStatus === "withNumber") {
      return !!this.props.getAnswer("numberInput");
    } else if (enabledStatus === "withAddress") {
      return !!this.props.getAnswer("addressInput");
    } else if (enabledStatus === "withDate") {
      return !!this.props.getAnswer("dateInput");
    }
    return !!enabledStatus;
  };

  render() {
    const { t } = this.props;
    return (
      <View style={[styles.card, !this.props.active && styles.inactive]}>
        {!this.props.active && (
          <TouchableOpacity
            style={styles.overlay}
            onPress={() => {
              this.props.onActivate();
            }}
          />
        )}
        {this.props.data.title && (
          <Title label={t("surveyTitle:" + this.props.data.title)} size="small" />
        )}
        {this.props.data.description && (
          <Description content={t("surveyDescription:" + this.props.data.description.label)} center={this.props.data.description.center} />
        )}
        {this.props.data.textInput && (
          <TextInput
            autoFocus={true}
            placeholder={t("surveyPlaceholder:" + this.props.data.textInput!.placeholder)}
            returnKeyType="done"
            value={this.props.getAnswer("textInput") ? this.props.getAnswer("textInput") : undefined}
            onChangeText={text => {
              this.props.updateAnswer({ textInput: text });
            }}
          />
        )}
        {this.props.data.dateInput && (
          <DateInput
            date={this.props.getAnswer("dateInput")}
            mode={this.props.data.dateInput.mode}
            placeholder={t("surveyPlaceholder:" + this.props.data.dateInput.placeholder)}
            onDateChange={(date: Date) => {
              this.props.updateAnswer({ dateInput: date });
            }}
          />
        )}
        {this.props.data.addressInput && (
          <AddressInput
            autoFocus={true}
            showLocationField={this.props.data.addressInput!.showLocationField}
            value={this.props.getAnswer("addressInput")}
            onChange={address => {
              this.props.updateAnswer({ addressInput: address });
            }}
          />
        )}
        {this.props.data.numberInput && (
          <NumberInput
            autoFocus={true}
            placeholder={t("surveyPlaceholder:" + this.props.data.numberInput!.placeholder)}
            returnKeyType="done"
            value={
              this.props.getAnswer("numberInput")
                ? "" + this.props.getAnswer("numberInput")
                : undefined
            }
            onChange={text => {
              this.props.updateAnswer({ numberInput: parseInt(text) });
            }}
            onSubmit={() => {}}
          />
        )}
        {this.props.data.optionList && (
          <OptionList
            data={newSelectedOptionsList(
              this.props.data.optionList!.options,
              this.props.getAnswer("options")
            )}
            multiSelect={this.props.data.optionList.multiSelect}
            numColumns={this.props.data.optionList.numColumns || 1}
            withOther={this.props.data.optionList.withOther}
            otherOption={this.props.getAnswer("otherOption")}
            onOtherChange={value => {
              this.props.updateAnswer({ otherOption: value });
            }}
            onChange={options => {
              this.props.updateAnswer({ options });
            }}
          />
        )}
        <View style={styles.buttonContainer}>
          {this.props.data.buttons.map((button: ButtonConfig) => (
            <Button
              checked={this.props.getAnswer("selectedButtonKey") === button.key}
              enabled={
                this.props.active && this._getButtonEnabled(button.enabled)
              }
              key={button.key}
              label={t("surveyButton:" + button.key)}
              onPress={() => {
                this.props.updateAnswer({ selectedButtonKey: button.key });
                this.props.onNext(this._getNextQuestion(button.key));
              }}
              primary={button.primary}
            />
          ))}
        </View>
      </View>
    );
  }
}

const styles = StyleSheet.create({
  card: {
    padding: 20,
  },
  buttonContainer: {
    alignItems: "center",
    justifyContent: "center",
  },
  inactive: {
    opacity: 0.25,
  },
  overlay: {
    bottom: 0,
    left: 0,
    position: "absolute",
    right: 0,
    top: 0,
    zIndex: 2,
  },
});

export default reduxWriter(withNamespaces()(SurveyQuestion));
