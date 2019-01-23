import React, { Component } from "react";
import {
  Alert,
  Image,
  Keyboard,
  View,
  StyleSheet,
  TouchableOpacity,
} from "react-native";
import { NavigationScreenProp } from "react-navigation";
import { WithNamespaces, withNamespaces } from "react-i18next";
import { Action, Address, Option, clearConsents } from "../../store/index";
import reduxWriter, { ReduxWriterProps } from "../../store/ReduxWriter";
import {
  ButtonConfig,
  EnabledOption,
  SurveyQuestionData,
} from "../../resources/QuestionnaireConfig";
import {
  AgeBuckets,
  AgeBucketConfig,
  ConsentConfig,
} from "../../resources/ScreenConfig";
import AddressInput from "./AddressInput";
import Button from "./Button";
import CountrySelectorInput from "./CountrySelectorInput";
import DateInput from "./DateInput";
import NumberInput from "./NumberInput";
import NumberSelectorInput from "./NumberSelectorInput";
import OptionList, { newSelectedOptionsList } from "./OptionList";
import Text from "./Text";
import TextInput from "./TextInput";
import Title from "./Title";

export interface SurveyQuestionProps {
  active: boolean;
  data: SurveyQuestionData;
  navigation: NavigationScreenProp<any, any>;
  locationType: string;
  dispatch(action: Action): void;
  onActivate(): void;
  onNext(nextQuestion: string | null): void;
}

interface State {
  addressInput?: Address;
  numberInput?: number | null;
  textInput?: string;
  otherOption?: string;
  [key: string]: undefined | Address | boolean | string | number | null;
}

class SurveyQuestion extends Component<
  SurveyQuestionProps & WithNamespaces & ReduxWriterProps,
  State
> {
  state: State = {};

  _getNextQuestion = (selectedButtonKey: string): string | null => {
    let nextQuestion = this.props.data.nextQuestion;
    if (!!this.props.data.conditionalNext) {
      if (!!this.props.data.conditionalNext.buttonAndLocation) {
        const location = this.props.data.conditionalNext!.location!.get(
          this.props.locationType
        );
        if (
          location != null &&
          location ===
            this.props.data.conditionalNext!.buttonKeys!.get(selectedButtonKey)
        ) {
          return location;
        }
      } else {
        // First check options
        if (!!this.props.data.conditionalNext!.options &&
            !!this.props.getAnswer("options")) {
          let nextOption = null;
          this.props.getAnswer("options").forEach((option: Option) => {
            if (
              option.selected &&
              this.props.data.conditionalNext!.options!.has(option.key)
            ) {
              nextOption = this.props.data.conditionalNext!.options!.get(option.key)!;
            }
          });
          if (nextOption != null) {
            return nextOption;
          }
        }

        // Second check age
        if (!!this.props.data.conditionalNext!.age) {
          const ageBucket = this.props.getAnswer(
            "selectedButtonKey",
            AgeBucketConfig.id
          );
          if (this.props.data.conditionalNext!.age!.has(ageBucket)) {
            return this.props.data.conditionalNext!.age!.get(ageBucket)!;
          }
        }

        // Third check button key
        if (
          !!this.props.data.conditionalNext!.buttonKeys &&
          this.props.data.conditionalNext!.buttonKeys!.has(selectedButtonKey)
        ) {
          return this.props.data.conditionalNext!.buttonKeys!.get(
            selectedButtonKey
          )!;
        }

        // Fourth check location
        if (
          !!this.props.data.conditionalNext!.location &&
          this.props.data.conditionalNext!.location!.has(
            this.props.locationType
          )
        ) {
          return this.props.data.conditionalNext!.location!.get(
            this.props.locationType
          )!;
        }

        // Finally check text answer
        if (
          !!this.props.data.conditionalNext!.text &&
          this.props.data.conditionalNext!.text!.has(
            this.props.getAnswer("textInput")
          )
        ) {
          return this.props.data.conditionalNext!.text!.get(
            this.props.getAnswer("textInput")
          )!;
        }
      }
    }
    return nextQuestion || null;
  };

  _getButtonEnabled = (enabledStatus: EnabledOption): boolean => {
    if (enabledStatus === "withOption") {
      const options = this.props.getAnswer("options");
      return (
        !!options &&
        options.reduce(
          (result: boolean, option: Option) => result || option.selected,
          false
        )
      );
    } else if (enabledStatus === "withOtherOption") {
      const options = this.props.getAnswer("options");
      const haveOption =
        !!options &&
        options.reduce(
          (result: boolean, option: Option) => result || option.selected,
          false
        );
      const haveOtherOption =
        haveOption &&
        options.reduce(
          (result: boolean, option: Option) =>
            result || (option.selected && option.key === "other"),
          false
        );
      return (
        haveOption && (!haveOtherOption || !!this._getValue("otherOption"))
      );
    } else if (enabledStatus === "withText") {
      return !!this._getValue("textInput");
    } else if (enabledStatus === "withNumber") {
      return Number.isInteger(parseInt(this._getValue("numberInput")));
    } else if (enabledStatus === "withNumberAndOption") {
      const options = this.props.getAnswer("options");
      return (
        !!options &&
        options.reduce(
          (result: boolean, option: Option) => result || option.selected,
          false
        ) &&
        Number.isInteger(parseInt(this._getValue("numberInput")))
      );
    } else if (enabledStatus === "withAddress") {
      return this._haveValidAddress();
    } else if (enabledStatus === "withDate") {
      return !!this.props.getAnswer("dateInput");
    }
    return !!enabledStatus;
  };

  _haveValidAddress = (): boolean => {
    const address = this._getValue("addressInput");
    return (
      !!address &&
      !!address.address &&
      !!address.city &&
      !!address.zipcode &&
      (!address.country ||
        (!!address.country &&
          (address.country === "United States" || !!address.state)))
    );
  };

  _getBirthDateDefaultYear() {
    const date = new Date();
    const year = date.getFullYear();
    const ageBucket = this.props.getAnswer(
      "selectedButtonKey",
      AgeBucketConfig.id
    );
    if (ageBucket === AgeBuckets.Over18) {
      date.setFullYear(year - 35);
    } else if (ageBucket === AgeBuckets.Teen) {
      date.setFullYear(year - 15);
    } else if (ageBucket === AgeBuckets.Child) {
      date.setFullYear(year - 10);
    }
    return date.getFullYear();
  }

  _getAdjustedAgeBucket(birthDate: Date): string {
    const today = new Date();
    let age = today.getFullYear() - birthDate.getFullYear();
    const m = today.getMonth() - birthDate.getMonth();
    if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) {
      age = age - 1;
    }

    if (age >= 18) {
      return AgeBuckets.Over18;
    } else if (age >= 13) {
      return AgeBuckets.Teen;
    } else if (age >= 7) {
      return AgeBuckets.Child;
    } else {
      return AgeBuckets.Under7;
    }
  }

  _reconsentNeeded(date: Date) {
    const ageBucket = this.props.getAnswer(
      "selectedButtonKey",
      AgeBucketConfig.id
    );
    const currentBucket = this._getAdjustedAgeBucket(date);
    return ageBucket !== currentBucket;
  }

  _reconsent(date: Date) {
    const newAgeBucket = this._getAdjustedAgeBucket(date);
    const { t } = this.props;
    Alert.alert(t("newConsentRequired"), t("ageDoesntMatch"), [
      {
        text: t("cancel"),
        onPress: () => {},
      },
      {
        text: t("continue"),
        onPress: () => {
          this.props.updateAnswer(
            { selectedButtonKey: newAgeBucket },
            AgeBucketConfig
          );
          this.props.dispatch(clearConsents());
          this.props.navigation.push("Consent", {
            data: ConsentConfig,
            reconsent: true,
            newAgeBucket,
          });
        },
      },
    ]);
  }

  _getValue = (valueType: string): any => {
    return typeof this.state[valueType] !== "undefined"
      ? this.state[valueType]
      : this.props.getAnswer(valueType);
  };

  _updateAddress = () => {
    const address = this.state.addressInput;
    if (address != null) {
      if (!address.country) {
        address.country = "United States";
      }
      if (!address.state && address.country === "United States") {
        address.state = "WA";
      }
      this.props.updateAnswer({
        selectedButtonKey: "done",
        addressInput: address,
      });
    }
  };

  componentDidMount() {
    if (this.props.data.textInput != null) {
      if (this.props.getAnswer("textInput") != null) {
        this.setState({ textInput: this.props.getAnswer("textInput") });
      }
    }
    if (this.props.data.numberInput != null) {
      if (this.props.getAnswer("numberInput") != null) {
        this.setState({ numberInput: this.props.getAnswer("numberInput") });
      }
    }
  }

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
          <Title
            label={t("surveyTitle:" + this.props.data.title)}
            size="small"
          />
        )}
        {this.props.data.description && (
          <Text
            content={t(
              "surveyDescription:" + this.props.data.description.label
            )}
            center={this.props.data.description.center}
            style={{ marginVertical: 0 }}
          />
        )}
        {this.props.data.image && (
          <View>
            <Text
              content={t("surveyDescription:" + this.props.data.image.label)}
              center={true}
            />
            <Image
              style={{ alignSelf: "center", height: 330, width: 600 }}
              source={this.props.data.image.src}
            />
          </View>
        )}
        {this.props.data.textInput && (
          <TextInput
            autoCorrect={this.props.data.textInput.autoCorrect}
            autoFocus={true}
            placeholder={t(
              "surveyPlaceholder:" + this.props.data.textInput!.placeholder
            )}
            returnKeyType="done"
            value={this._getValue("textInput")}
            onChangeText={textInput => this.setState({ textInput })}
            onSubmitEditing={() => {
              if (!!this.state.textInput) {
                this.props.updateAnswer({
                  textInput: this.state.textInput,
                  selectedButtonKey: "done",
                });
                this.props.onNext(this._getNextQuestion("done"));
              }
            }}
          />
        )}
        {this.props.data.dateInput && (
          <DateInput
            date={this.props.getAnswer("dateInput")}
            defaultYear={
              this.props.data.id === "BirthDate"
                ? this._getBirthDateDefaultYear()
                : null
            }
            mode={this.props.data.dateInput.mode}
            placeholder={t(
              "surveyPlaceholder:" + this.props.data.dateInput.placeholder
            )}
            onDateChange={(dateInput: Date) => {
              this.props.updateAnswer({ dateInput });
              if (
                this.props.data.id !== "BirthDate" ||
                !this._reconsentNeeded(dateInput)
              ) {
                this.props.onNext(this._getNextQuestion("done"));
              }
            }}
          />
        )}
        {this.props.data.addressInput && (
          <AddressInput
            autoFocus={true}
            showLocationField={this.props.data.addressInput!.showLocationField}
            value={this._getValue("addressInput")}
            onChange={(addressInput: Address) =>
              this.setState({ addressInput })
            }
            onDone={() => {
              this._updateAddress();
              if (this._haveValidAddress()) {
                this.props.onNext(this._getNextQuestion("done"));
              }
            }}
          />
        )}
        {this.props.data.numberInput && (
          <NumberInput
            autoFocus={true}
            placeholder={t(
              "surveyPlaceholder:" + this.props.data.numberInput!.placeholder
            )}
            returnKeyType="done"
            value={
              typeof this._getValue("numberInput") === "number"
                ? "" + this._getValue("numberInput")
                : typeof this._getValue("numberInput") === "object"
                  ? ""
                  : undefined
            }
            onChangeText={text => {
              const numericText = text.replace(/[^0-9]/g, "");
              if (numericText.length == 0) {
                this.setState({ numberInput: null });
              } else {
                var num = parseInt(numericText);
                if (isNaN(num)) {
                  this.setState({ numberInput: null });
                } else {
                  this.setState({ numberInput: num });
                }
              }
            }}
            onSubmitEditing={() => {
              this.props.updateAnswer({
                numberInput: this.state.numberInput,
                selectedButtonKey: "done",
              });
              this.props.onNext(this._getNextQuestion("done"));
            }}
          />
        )}
        {this.props.data.numberSelector && (
          <NumberSelectorInput
            min={this.props.data.numberSelector!.min}
            max={this.props.data.numberSelector!.max}
            maxPlus={this.props.data.numberSelector!.maxPlus}
            num={this.props.getAnswer("numberInput")}
            placeholder={t(
              "surveyPlaceholder:" + this.props.data.numberSelector!.placeholder
            )}
            onNumChange={(num: number) => {
              this.props.updateAnswer({
                numberInput: num,
              });

              if (this.props.data.buttons[0].enabled === "withNumber") {
                this.props.updateAnswer({
                  selectedButtonKey: "done",
                });
                this.props.onNext(this._getNextQuestion("done"));
              }
            }}
          />
        )}
        {this.props.data.countrySelector && (
          <CountrySelectorInput
            country={this.props.getAnswer("textInput")}
            placeholder={t(
              "surveyPlaceholder:" +
                this.props.data.countrySelector!.placeholder
            )}
            onCountryChange={(country: string) => {
              this.props.updateAnswer({
                textInput: country,
                selectedButtonKey: "done",
              });
              this.props.onNext(this._getNextQuestion("done"));
            }}
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
            exclusiveOption={this.props.data.optionList.exclusiveOption}
            withOther={this.props.data.optionList.withOther}
            otherOption={this._getValue("otherOption")}
            otherPlaceholder={
              !!this.props.data.optionList!.otherPlaceholder
                ? t(
                    "surveyPlaceholder:" +
                      this.props.data.optionList!.otherPlaceholder
                  )
                : undefined
            }
            onOtherChange={otherOption => this.setState({ otherOption })}
            onChange={options => this.props.updateAnswer({ options })}
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
                Keyboard.dismiss();
                if (
                  this.props.data.id === "BirthDate" &&
                  this._reconsentNeeded(this.props.getAnswer("dateInput"))
                ) {
                  this._reconsent(this.props.getAnswer("dateInput"));
                  return;
                } else {
                  if (typeof this.state.textInput !== "undefined") {
                    this.props.updateAnswer({
                      textInput: this.state.textInput,
                    });
                  }
                  if (typeof this.state.numberInput !== "undefined") {
                    this.props.updateAnswer({
                      numberInput: this.state.numberInput,
                    });
                  }
                  if (typeof this.state.otherOption !== "undefined") {
                    this.props.updateAnswer({
                      otherOption: this.state.otherOption,
                    });
                  }
                  if (typeof this.state.addressInput !== "undefined") {
                    this._updateAddress();
                  }
                  this.props.updateAnswer({ selectedButtonKey: button.key });
                  this.props.onNext(this._getNextQuestion(button.key));
                }
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

export default reduxWriter(withNamespaces("surveyQuestion")(SurveyQuestion));
