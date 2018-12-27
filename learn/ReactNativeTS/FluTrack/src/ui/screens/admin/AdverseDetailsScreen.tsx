// Copyright (c) 2018 by Audere
//
// Use of this source code is governed by an MIT-style license that
// can be found in the LICENSE file distributed with this file.

import React from "react";
import { withNamespaces, WithNamespaces } from "react-i18next";
import { NavigationScreenProp } from "react-navigation";
import { Text, StyleSheet, View, Alert, TouchableOpacity } from "react-native";
import { connect } from "react-redux";
import { Option, StoreState } from "../../../store";
import reduxWriter, { ReduxWriterProps } from "../../../store/ReduxWriter";
import { PostCollectionQuestions, OptionKeyToQuestion } from "./QuestionConfig";
import BackButton from "../../components/BackButton";
import Button from "../../components/Button";
import FeedbackButton from "../../components/FeedbackButton";
import FeedbackModal from "../../components/FeedbackModal";
import OptionList, {
  newSelectedOptionsList,
} from "../../components/OptionList";
import ScreenContainer from "../../components/ScreenContainer";
import { OptionListConfig } from "../../../resources/QuestionnaireConfig";

interface Props {
  name: string;
  navigation: NavigationScreenProp<any, any>;
  screenProps: any;
}

interface State {
  otherOptionMap: Map<string, string>;
  feedbackVisible: boolean;
}

const WhichProcedures = PostCollectionQuestions.WhichProcedures;

@connect((state: StoreState) => ({
  name: state.form.name,
}))
class AdverseDetailsScreen extends React.Component<
  Props & WithNamespaces & ReduxWriterProps,
  State
> {
  static navigationOptions = ({
    navigation,
  }: {
    navigation: NavigationScreenProp<any, any>;
  }) => {
    const { params = null } = navigation.state;
    return {
      title: "Adverse Events",
      headerLeft: <BackButton navigation={navigation} text={"Back"} />,
      headerRight: !!params ? (
        <FeedbackButton onPress={params.showFeedback} />
      ) : null,
    };
  };

  state = {
    feedbackVisible: false,
    otherOptionMap: new Map<string, string>(),
  };

  componentDidMount() {
    this.props.navigation.setParams({
      showFeedback: () => this.setState({ feedbackVisible: true }),
    });
  }

  _eventsOccurred = (eventTypeKey: string): boolean => {
    const adverseProcedures = this.props.getAnswer(
      "options",
      WhichProcedures.id
    );
    if (!!adverseProcedures) {
      const event = adverseProcedures.find(
        (procedure: Option) => procedure.key === eventTypeKey
      );
      return !!event && event.selected;
    }
    return false;
  };

  _canSave = (): boolean => {
    const allValid = Object.keys(OptionKeyToQuestion)
      .filter(key => this._eventsOccurred(key))
      .map(key => {
        const options = this.props.getAnswer(
          "options",
          OptionKeyToQuestion[key].id
        );
        return (
          !!options &&
          options.reduce(
            (result: boolean, option: Option) => result || option.selected,
            false
          )
        );
      })
      .reduce((result, value) => result && value, true);
    return !!allValid;
  };

  _onSave = () => {
    Alert.alert(
      "Submit?",
      `Adverse events will be recorded for ${this.props.name}.`,
      [
        {
          text: "Cancel",
          onPress: () => {},
        },
        {
          text: "OK",
          onPress: () => {
            this.state.otherOptionMap.forEach((otherOption, key) => {
              this.props.updateAnswer(
                { otherOption },
                OptionKeyToQuestion[key]
              );
            });
            this.props.navigation.popToTop();
          },
        },
      ]
    );
  };

  _getOtherOption = (key: string): string | null => {
    return this.state.otherOptionMap.has(key)
      ? this.state.otherOptionMap.get(key)
      : this.props.getAnswer("otherOption", OptionKeyToQuestion[key].id);
  };

  render() {
    return (
      <ScreenContainer>
        <FeedbackModal
          visible={this.state.feedbackVisible}
          onDismiss={() => this.setState({ feedbackVisible: false })}
        />
        {Object.keys(OptionKeyToQuestion)
          .filter(key => this._eventsOccurred(key))
          .map(
            key =>
              OptionKeyToQuestion[key].optionList && (
                <View key={key}>
                  <Text style={styles.sectionHeaderText}>
                    {OptionKeyToQuestion[key].title}
                  </Text>
                  <OptionList
                    backgroundColor="#fff"
                    data={newSelectedOptionsList(
                      OptionKeyToQuestion[key].optionList!.options,
                      this.props.getAnswer(
                        "options",
                        OptionKeyToQuestion[key].id
                      )
                    )}
                    fullWidth={true}
                    multiSelect={
                      OptionKeyToQuestion[key].optionList!.multiSelect
                    }
                    withOther={OptionKeyToQuestion[key].optionList!.withOther}
                    numColumns={1}
                    otherOption={this._getOtherOption(key)}
                    onOtherChange={value => {
                      const otherOptionMap = this.state.otherOptionMap;
                      otherOptionMap.set(key, value);
                      this.setState({ otherOptionMap });
                    }}
                    onChange={options =>
                      this.props.updateAnswer(
                        { options },
                        OptionKeyToQuestion[key]
                      )
                    }
                  />
                </View>
              )
          )}
        <View style={styles.buttonContainer}>
          <Button
            enabled={this._canSave()}
            key="save"
            label="Save"
            primary={true}
            onPress={this._onSave}
          />
        </View>
      </ScreenContainer>
    );
  }
}

const styles = StyleSheet.create({
  buttonContainer: {
    alignItems: "center",
    justifyContent: "center",
  },
  sectionHeaderText: {
    marginTop: 35,
    marginBottom: 7,
    marginLeft: 15,
    fontSize: 24,
  },
});

export default reduxWriter(withNamespaces()(AdverseDetailsScreen));
