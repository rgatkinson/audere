import React from "react";
import { NavigationScreenProp } from "react-navigation";
import { connect } from "react-redux";
import { StoreState } from "../../../store/index";
import {
  Action,
  setSurveyResponses,
  SurveyResponse,
  SurveyAnswer,
} from "../../../store";
import OptionList from "../experiment/components/OptionList";
import { Icon } from "react-native-elements";
import { Text, StyleSheet, View, Alert, TouchableOpacity } from "react-native";
import { PostCollectionQuestions, OptionKeyToQuestion } from "./QuestionConfig";
import ScreenContainer from "../experiment/components/ScreenContainer";
import { withNamespaces, WithNamespaces } from "react-i18next";
import { OptionListConfig } from "../experiment/components/SurveyQuestion";

interface Props {
  navigation: NavigationScreenProp<any, any>;
  surveyResponses?: Map<string, SurveyResponse>;
  dispatch(action: Action): void;
  screenProps: any;
}

const WhichProcedures = PostCollectionQuestions.WhichProcedures;
@connect((state: StoreState) => ({
  surveyResponses: state.form!.surveyResponses,
  name: state.form!.name,
}))
class AdverseDetailsScreen extends React.Component<Props & WithNamespaces> {
  static navigationOptions = ({
    navigation,
  }: {
    navigation: NavigationScreenProp<any, any>;
  }) => {
    const params = navigation.state.params;
    return params == null
      ? {}
      : {
          title: "Adverse Events",
          headerLeft: (
            <TouchableOpacity
              onPress={() => navigation.goBack()}
              style={styles.actionContainerWithIcon}
            >
              <Icon
                name="chevron-left"
                color="#007AFF"
                size={30}
                type="feather"
              />
              <Text style={styles.actionText}>Back</Text>
            </TouchableOpacity>
          ),
          headerRight: (
            <TouchableOpacity
              onPress={params._onSave}
              style={styles.actionContainer}
            >
              <Text style={styles.actionText}>Save</Text>
            </TouchableOpacity>
          ),
        };
  };
  componentWillMount() {
    this.props.navigation.setParams({
      _onSave: this._onSave,
    });
  }
  _getSelectedOptionMap = (
    id: string,
    optionList: OptionListConfig
  ): Map<string, boolean> => {
    return !!this.props.surveyResponses &&
      this.props.surveyResponses!.has(id) &&
      !!this.props.surveyResponses!.get(id)!.answer &&
      !!this.props.surveyResponses!.get(id)!.answer!.options
      ? new Map<string, boolean>(
          this.props.surveyResponses.get(id)!.answer!.options!
        )
      : OptionList.emptyMap(optionList.options);
  };
  _getAndInitializeResponse = (
    id: string,
    title: string,
    optionList: OptionListConfig
  ): [Map<string, SurveyResponse>, SurveyAnswer] => {
    const responses = this.props.surveyResponses
      ? new Map<string, SurveyResponse>(this.props.surveyResponses)
      : new Map<string, SurveyResponse>();

    if (!responses.has(id)) {
      const optionKeysToLabel =
        optionList && optionList.options
          ? new Map<string, string>(
              optionList.options.map<[string, string]>(key => [
                key,
                this.props.t("surveyOption:" + key),
              ])
            )
          : undefined;
      responses.set(id, {
        answer: {},
        optionKeysToLabel: optionKeysToLabel,
        questionId: id,
        questionText: title,
      });
    }

    return [responses, responses.has(id) ? responses.get(id)!.answer! : {}];
  };
  _eventsOccurred = (eventTypeKey: string): boolean => {
    return (
      !!this.props.surveyResponses &&
      !!this.props.surveyResponses.get(WhichProcedures.id) &&
      !!this.props.surveyResponses.get(WhichProcedures.id)!.answer!.options &&
      !!this.props.surveyResponses
        .get(WhichProcedures.id)!
        .answer!.options!.get(eventTypeKey)
    );
  };
  _onSave = () => {
    let responseValid = true;
    Object.keys(OptionKeyToQuestion).map(key => {
      if (this._eventsOccurred(key) && responseValid) {
        let options =
          this.props.surveyResponses!.has(OptionKeyToQuestion[key].id) &&
          !!this.props.surveyResponses!.get(OptionKeyToQuestion[key].id)!.answer
            ? this.props.surveyResponses!.get(OptionKeyToQuestion[key].id)!
                .answer!.options
            : null;
        responseValid = !!options
          ? Array.from(options.values()).reduce(
              (result, value) => result || value,
              false
            )
          : false;
        if (!responseValid) {
          Alert.alert(
            `Please specify at least 1 adverse event for ${this.props.t(
              "surveyOption:" + key
            )}.`
          );
          return;
        }
      }
    });
    if (responseValid) {
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
              this.props.navigation.popToTop();
            },
          },
        ]
      );
    }
  };

  render() {
    return (
      <ScreenContainer>
        {Object.keys(OptionKeyToQuestion)
          .filter(key => this._eventsOccurred(key))
          .map(key => (
            <View key={key}>
              <Text style={styles.sectionHeaderText}>
                {OptionKeyToQuestion[key].title}
              </Text>
              <OptionList
                data={this._getSelectedOptionMap(
                  OptionKeyToQuestion[key].id,
                  OptionKeyToQuestion[key].optionList
                )}
                multiSelect={OptionKeyToQuestion[key].optionList.multiSelect}
                withOther={OptionKeyToQuestion[key].optionList.withOther}
                numColumns={1}
                fullWidth={true}
                backgroundColor="#fff"
                onOtherChange={value => {
                  const [
                    responses,
                    existingAnswer,
                  ] = this._getAndInitializeResponse(
                    OptionKeyToQuestion[key].id,
                    OptionKeyToQuestion[key].title,
                    OptionKeyToQuestion[key].optionList
                  );
                  responses.set(OptionKeyToQuestion[key].id, {
                    ...responses.get(OptionKeyToQuestion[key].id),
                    answer: { ...existingAnswer, otherOption: value },
                  });
                  this.props.dispatch(setSurveyResponses(responses));
                }}
                onChange={data => {
                  const [
                    responses,
                    existingAnswer,
                  ] = this._getAndInitializeResponse(
                    OptionKeyToQuestion[key].id,
                    OptionKeyToQuestion[key].title,
                    OptionKeyToQuestion[key].optionList
                  );
                  responses.set(OptionKeyToQuestion[key].id, {
                    ...responses.get(OptionKeyToQuestion[key].id),
                    answer: { ...existingAnswer, options: data },
                  });
                  this.props.dispatch(setSurveyResponses(responses));
                }}
              />
            </View>
          ))}
        }
      </ScreenContainer>
    );
  }
}

const styles = StyleSheet.create({
  sectionHeaderText: {
    marginTop: 35,
    marginBottom: 7,
    marginLeft: 15,
    fontSize: 24,
  },
  actionContainer: {
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "center",
    paddingHorizontal: 15,
  },
  actionContainerWithIcon: {
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "center",
  },
  actionText: {
    fontFamily: "System",
    fontSize: 17,
    color: "#007AFF",
    lineHeight: 22,
    letterSpacing: -0.41,
  },
});

export default withNamespaces()<Props>(AdverseDetailsScreen);
