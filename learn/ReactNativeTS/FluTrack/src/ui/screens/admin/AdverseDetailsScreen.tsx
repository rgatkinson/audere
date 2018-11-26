import React from "react";
import { NavigationScreenProp } from "react-navigation";
import { connect } from "react-redux";
import { StoreState } from "../../../store/index";
import { Action, setSurveyResponses, SurveyResponse } from "../../../store";
import OptionList from "../experiment/components/OptionList";
import { Icon } from "react-native-elements";
import { Text, StyleSheet, View, Alert, TouchableOpacity } from "react-native";
import { PostCollectionQuestions, OptionKeyToQuestion } from "./QuestionConfig";
import ScreenContainer from "../experiment/components/ScreenContainer";
import PostCollectionScreen from "./PostCollectionScreen";

interface Props {
  navigation: NavigationScreenProp<any, any>;
  surveyResponses?: Map<string, SurveyResponse>;
  dispatch(action: Action): void;
  screenProps: any;
}

const participantName = "John Doe"; //TODO: read the name out of redux
const WhichProcedures = PostCollectionQuestions.WhichProcedures;
@connect((state: StoreState) => ({
  surveyResponses: state.form!.surveyResponses,
}))
export default class AdverseDetailsScreen extends PostCollectionScreen<Props> {
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
          Alert.alert(`Please specify at least 1 adverse event for ${key}.`);
          return;
        }
      }
    });
    if (responseValid) {
      Alert.alert(
        "Submit?",
        `Adverse events will be recorded for ${participantName}.`,
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
                  OptionKeyToQuestion[key].optionList,
                  this.props.surveyResponses
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
                    this.props.surveyResponses
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
                    this.props.surveyResponses
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
