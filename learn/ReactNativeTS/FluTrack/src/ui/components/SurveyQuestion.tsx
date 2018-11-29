import React, { Component } from "react";
import { View, StyleSheet, TouchableOpacity } from "react-native";
import { WithNamespaces, withNamespaces } from "react-i18next";
import { Action } from "../../store/index";
import reduxWriter, { ReduxWriterProps } from "../../store/ReduxWriter";
import AddressInput from "./AddressInput";
import Button from "./Button";
import DateInput from "./DateInput";
import Description from "./Description";
import NumberInput from "./NumberInput";
import OptionList from "./OptionList";
import TextInput from "./TextInput";
import Title from "./Title";

type EnabledOption =
  | true
  | false
  | "withOption"
  | "withText"
  | "withAddress"
  | "withNumber"
  | "withDate";

interface ButtonConfig {
  key: string;
  primary: boolean;
  enabled: EnabledOption;
}

interface ConditionalNextConfig {
  options?: Map<string, string>;
  buttonKeys?: Map<string, string>;
}

export interface OptionListConfig {
  options: string[];
  multiSelect: boolean;
  numColumns?: number;
  withOther: boolean;
}

interface TextInputConfig {
  placeholder: string;
}

interface NumberInputConfig {
  placeholder: string;
}

interface AddressInputConfig {
  showLocationField: boolean;
}

interface DateInputConfig {
  autoFocus: boolean;
  placeholder: string;
}

export interface SurveyQuestionProps {
  id: string;
  active: boolean;
  addressInput: AddressInputConfig;
  buttons: ButtonConfig[];
  conditionalNext: ConditionalNextConfig;
  dateInput: DateInputConfig;
  description: string;
  nextQuestion: string;
  numberInput: NumberInputConfig;
  title: string;
  textInput: TextInputConfig;
  optionList: OptionListConfig;
  dispatch(action: Action): void;
  onActivate(): void;
  onNext(nextQuestion: string): void;
}

class SurveyQuestion extends Component<
  SurveyQuestionProps & WithNamespaces & ReduxWriterProps
> {
  _getNextQuestion = (selectedButtonKey: string): string => {
    let nextQuestion = this.props.nextQuestion;
    if (this.props.conditionalNext) {
      this.props.conditionalNext!.options &&
        this._getSelectedOptionMap().forEach((value, key) => {
          if (value && this.props.conditionalNext!.options!.has(key)) {
            nextQuestion = this.props.conditionalNext!.options!.get(key)!;
          }
        });
      !!this.props.conditionalNext!.buttonKeys &&
        this.props.conditionalNext!.buttonKeys!.forEach((question: string, key: string) => {
          if (key === selectedButtonKey) {
            nextQuestion = question;
          }
        });
    }
    // TODO admin conditional next
    return nextQuestion;
  };

  _getSelectedOptionMap = (): Map<string, boolean> => {
    const options = this.props.getAnswer("options");
    return options
      ? new Map<string, boolean>(options)
      : OptionList.emptyMap(this.props.optionList.options);
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
        <Title label={this.props.title} size="small" />
        {this.props.description && (
          <Description content={this.props.description} />
        )}
        {this.props.textInput && (
          <TextInput
            autoFocus={true}
            placeholder={this.props.textInput!.placeholder}
            returnKeyType="done"
            value={this.props.getAnswer("textInput")}
            onChange={text => {
              this.props.updateAnswer({ textInput: text });
            }}
          />
        )}
        {this.props.dateInput && (
          <DateInput
            autoFocus={this.props.dateInput.autoFocus}
            date={this.props.getAnswer("dateInput")}
            placeholder={this.props.dateInput.placeholder}
            onDateChange={(date: Date) => {
              this.props.updateAnswer({ dateInput: date });
            }}
          />
        )}
        {this.props.addressInput && (
          <AddressInput
            autoFocus={true}
            showLocationField={this.props.addressInput!.showLocationField}
            value={this.props.getAnswer("addressInput")}
            onChange={address => {
              this.props.updateAnswer({ addressInput: address });
            }}
          />
        )}
        {this.props.numberInput && (
          <NumberInput
            autoFocus={true}
            placeholder={this.props.numberInput!.placeholder}
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
        {this.props.optionList && (
          <OptionList
            data={this._getSelectedOptionMap()}
            multiSelect={this.props.optionList.multiSelect}
            numColumns={this.props.optionList.numColumns || 1}
            withOther={this.props.optionList.withOther}
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
          {this.props.buttons.map((button: ButtonConfig) => (
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
  buttonText: {
    color: "white",
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
