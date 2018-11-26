import React, { Component } from "react";
import { View, StyleSheet, TouchableOpacity } from "react-native";
import { connect } from "react-redux";
import { WithNamespaces, withNamespaces } from "react-i18next";
import { StoreState } from "../../../../store/index";
import {
  Action,
  Address,
  SurveyAnswer,
  SurveyResponse,
  setSurveyResponses,
} from "../../../../store";
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

interface OptionListConfig {
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

interface Props {
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
  surveyResponses?: Map<string, SurveyResponse>;
  dispatch(action: Action): void;
  onActivate(): void;
  onNext(nextQuestion: string): void;
}

@connect((state: StoreState) => ({
  surveyResponses: state.form!.surveyResponses,
}))
class SurveyQuestion extends Component<Props & WithNamespaces> {
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
        this.props.conditionalNext!.buttonKeys!.forEach((question, key) => {
          if (key === selectedButtonKey) {
            nextQuestion = question;
          }
        });
    }
    // TODO admin conditional next
    return nextQuestion;
  };

  _getSelectedOptionMap = (): Map<string, boolean> => {
    return !!this.props.surveyResponses &&
      this.props.surveyResponses!.has(this.props.id) &&
      !!this.props.surveyResponses!.get(this.props.id)!.answer &&
      !!this.props.surveyResponses!.get(this.props.id)!.answer!.options
      ? new Map<string, boolean>(
          this.props.surveyResponses.get(this.props.id)!.answer!.options!
        )
      : OptionList.emptyMap(this.props.optionList.options);
  };

  // TODO refactor this mess
  _getEnteredTextInput = (): string | null => {
    return (
      (!!this.props.surveyResponses &&
        this.props.surveyResponses!.has(this.props.id) &&
        this.props.surveyResponses.get(this.props.id)!.answer &&
        this.props.surveyResponses.get(this.props.id)!.answer!.textInput) ||
      null
    );
  };

  _getEnteredNumberInput = (): number | null => {
    return (
      (!!this.props.surveyResponses &&
        this.props.surveyResponses!.has(this.props.id) &&
        this.props.surveyResponses.get(this.props.id)!.answer &&
        this.props.surveyResponses.get(this.props.id)!.answer!.numberInput) ||
      null
    );
  };

  _getOtherOption = (): string | null => {
    return (
      (!!this.props.surveyResponses &&
        this.props.surveyResponses!.has(this.props.id) &&
        this.props.surveyResponses.get(this.props.id)!.answer &&
        this.props.surveyResponses.get(this.props.id)!.answer!.otherOption) ||
      null
    );
  };

  _getEnteredAddress = (): Address | null => {
    return (
      (!!this.props.surveyResponses &&
        this.props.surveyResponses!.has(this.props.id) &&
        this.props.surveyResponses.get(this.props.id)!.answer &&
        this.props.surveyResponses.get(this.props.id)!.answer!.addressInput) ||
      null
    );
  };

  _getEnteredDate = (): Date | null => {
    return (
      (!!this.props.surveyResponses &&
        this.props.surveyResponses!.has(this.props.id) &&
        this.props.surveyResponses.get(this.props.id)!.answer &&
        this.props.surveyResponses.get(this.props.id)!.answer!.dateInput) ||
      null
    );
  };

  _getSelectedButtonKey = (): string | null => {
    return (
      (!!this.props.surveyResponses &&
        this.props.surveyResponses!.has(this.props.id) &&
        this.props.surveyResponses.get(this.props.id)!.answer &&
        this.props.surveyResponses.get(this.props.id)!.answer!
          .selectedButtonKey) ||
      null
    );
  };

  _getAndInitializeResponse = (): [
    Map<string, SurveyResponse>,
    SurveyAnswer
  ] => {
    const responses = this.props.surveyResponses
      ? new Map<string, SurveyResponse>(this.props.surveyResponses)
      : new Map<string, SurveyResponse>();

    if (!responses.has(this.props.id)) {
      const buttonOptions = new Map<string, string>(
        this.props.buttons.map<[string, string]>(button => [
          button.key,
          this.props.t("surveyButton:" + button.key),
        ])
      );

      const optionKeysToLabel = this.props.optionList && this.props.optionList.options ? new Map<string, string> (
        this.props.optionList.options.map<[string, string]>(key => [
          key,
          this.props.t("surveyOption:" + key),
        ])
      ) : undefined;

      responses.set(this.props.id, {
        answer: {},
        buttonOptions: buttonOptions,
        optionKeysToLabel: optionKeysToLabel,
        questionId: this.props.id,
        questionText: this.props.title || this.props.description,
      });
    }

    return [
      responses,
      responses.has(this.props.id) ? responses.get(this.props.id)!.answer! : {},
    ];
  };

  _getButtonEnabled = (enabledStatus: EnabledOption): boolean => {
    if (enabledStatus === "withOption") {
      return Array.from(this._getSelectedOptionMap().values()).reduce(
        (val, entry) => val || entry
      );
    } else if (enabledStatus === "withText") {
      return !!this._getEnteredTextInput();
    } else if (enabledStatus === "withNumber") {
      return !!this._getEnteredNumberInput();
    } else if (enabledStatus === "withAddress") {
      return !!this._getEnteredAddress();
    } else if (enabledStatus === "withDate") {
      return !!this._getEnteredDate();
    }
    return !!enabledStatus;
  };

  render() {
    console.log(this.props.surveyResponses);
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
            value={this._getEnteredTextInput()}
            onChange={text => {
              const [
                responses,
                existingAnswer,
              ] = this._getAndInitializeResponse();
              responses.set(this.props.id, {
                ...responses.get(this.props.id),
                answer: { ...existingAnswer, textInput: text },
              });
              this.props.dispatch(setSurveyResponses(responses));
            }}
          />
        )}
        {this.props.dateInput && (
          <DateInput
            autoFocus={this.props.dateInput.autoFocus}
            date={this._getEnteredDate()}
            placeholder={this.props.dateInput.placeholder}
            onDateChange={(date: Date) => {
              const [
                responses,
                existingAnswer,
              ] = this._getAndInitializeResponse();
              responses.set(this.props.id, {
                ...responses.get(this.props.id),
                answer: { ...existingAnswer, dateInput: date },
              });
              this.props.dispatch(setSurveyResponses(responses));
            }}
          />
        )}
        {this.props.addressInput && (
          <AddressInput
            autoFocus={true}
            showLocationField={this.props.addressInput!.showLocationField}
            value={
              this._getEnteredAddress() ? this._getEnteredAddress() : undefined
            }
            onChange={address => {
              const [
                responses,
                existingAnswer,
              ] = this._getAndInitializeResponse();
              responses.set(this.props.id, {
                ...responses.get(this.props.id),
                answer: { ...existingAnswer, addressInput: address },
              });
              this.props.dispatch(setSurveyResponses(responses));
            }}
          />
        )}
        {this.props.numberInput && (
          <NumberInput
            autoFocus={true}
            placeholder={this.props.numberInput!.placeholder}
            returnKeyType="done"
            value={
              this._getEnteredNumberInput()
                ? "" + this._getEnteredNumberInput()
                : undefined
            }
            onChange={(text: string) => {
              const [
                responses,
                existingAnswer,
              ] = this._getAndInitializeResponse();
              responses.set(this.props.id, {
                ...responses.get(this.props.id),
                answer: { ...existingAnswer, numberInput: parseInt(text) },
              });
              this.props.dispatch(setSurveyResponses(responses));
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
            otherOption={this._getOtherOption()}
            onOtherChange={value => {
              const [
                responses,
                existingAnswer,
              ] = this._getAndInitializeResponse();
              responses.set(this.props.id, {
                ...responses.get(this.props.id),
                answer: { ...existingAnswer, otherOption: value },
              });
              this.props.dispatch(setSurveyResponses(responses));
            }}
            onChange={data => {
              const [
                responses,
                existingAnswer,
              ] = this._getAndInitializeResponse();
              responses.set(this.props.id, {
                ...responses.get(this.props.id),
                answer: {
                  ...existingAnswer,
                  options: data,
                },
              });
              this.props.dispatch(setSurveyResponses(responses));
            }}
          />
        )}
        <View style={styles.buttonContainer}>
          {this.props.buttons.map(button => (
            <Button
              checked={this._getSelectedButtonKey() === button.key}
              enabled={
                this.props.active && this._getButtonEnabled(button.enabled)
              }
              key={button.key}
              label={this.props.t("surveyButton:" + button.key)}
              onPress={() => {
                const [
                  responses,
                  existingAnswer,
                ] = this._getAndInitializeResponse();
                responses.set(this.props.id, {
                  ...responses.get(this.props.id),
                  answer: {
                    ...existingAnswer,
                    selectedButtonKey: button.key,
                  },
                });
                this.props.dispatch(setSurveyResponses(responses));
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

export default withNamespaces()<Props>(SurveyQuestion);
