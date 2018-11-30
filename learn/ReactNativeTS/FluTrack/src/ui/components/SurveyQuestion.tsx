import React, { Component } from "react";
import { View, StyleSheet, TouchableOpacity } from "react-native";
import { WithNamespaces, withNamespaces } from "react-i18next";
import { Action } from "../../store/index";
import reduxWriter, { ReduxWriterProps } from "../../store/ReduxWriter";
import { ButtonConfig, EnabledOption, SurveyQuestionData } from "../../resources/QuestionnaireConfig";
import AddressInput from "./AddressInput";
import Button from "./Button";
import DateInput from "./DateInput";
import Description from "./Description";
import NumberInput from "./NumberInput";
import OptionList from "./OptionList";
import TextInput from "./TextInput";
import Title from "./Title";

export interface SurveyQuestionProps {
  active: boolean;
  data: SurveyQuestionData;
  dispatch(action: Action): void;
  onActivate(): void;
  onNext(nextQuestion: string | null): void;
}

class SurveyQuestion extends Component<
  SurveyQuestionProps & WithNamespaces & ReduxWriterProps
> {
  _getNextQuestion = (selectedButtonKey: string): string | null => {
    let nextQuestion = this.props.data.nextQuestion;
    if (this.props.data.conditionalNext) {
      this.props.data.conditionalNext!.options &&
        this._getSelectedOptionMap().forEach((value, key) => {
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
    return nextQuestion;
  };

  _getSelectedOptionMap = (): Map<string, boolean> => {
    const allOptions = this.props.data.optionList
      ? this.props.data.optionList!.options
      : [];
    const options = this.props.getAnswer("options");
    return options
      ? new Map<string, boolean>(options)
      : OptionList.emptyMap(allOptions);
  };

  _getButtonEnabled = (enabledStatus: EnabledOption): boolean => {
    if (enabledStatus === "withOption") {
      return Array.from(this._getSelectedOptionMap().values()).reduce(
        (val, entry) => val || entry
      );
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
          <Title label={this.props.data.title} size="small" />
        )}
        {this.props.data.description && (
          <Description content={this.props.data.description} />
        )}
        {this.props.data.textInput && (
          <TextInput
            autoFocus={true}
            placeholder={this.props.data.textInput!.placeholder}
            returnKeyType="done"
            value={this.props.getAnswer("textInput")}
            onChange={text => {
              this.props.updateAnswer({ textInput: text });
            }}
          />
        )}
        {this.props.data.dateInput && (
          <DateInput
            autoFocus={this.props.data.dateInput.autoFocus}
            date={this.props.getAnswer("dateInput")}
            placeholder={this.props.data.dateInput.placeholder}
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
            placeholder={this.props.data.numberInput!.placeholder}
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
            data={this._getSelectedOptionMap()}
            multiSelect={this.props.data.optionList.multiSelect}
            numColumns={this.props.data.optionList.numColumns || 1}
            withOther={this.props.data.optionList.withOther}
            otherOption={this.props.getAnswer("otherOption")}
            onOtherChange={value => {
              this.props.updateAnswer({ otherOption: value });
            }}
            onChange={data => {
              this.props.updateAnswer({ options: data });
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
              label={this.props.t("surveyButton:" + button.key)}
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
