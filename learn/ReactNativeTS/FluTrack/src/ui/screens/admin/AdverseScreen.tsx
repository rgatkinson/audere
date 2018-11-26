import React from "react";
import { NavigationScreenProp } from "react-navigation";
import { connect } from "react-redux";
import { StoreState } from "../../../store/index";
import { Action, SurveyResponse, setSurveyResponses } from "../../../store";
import { PostCollectionQuestions } from "./QuestionConfig";
import OptionList from "../experiment/components/OptionList";
import { Text, StyleSheet, View, Alert, TouchableOpacity } from "react-native";
import ScreenContainer from "../experiment/components/ScreenContainer";
import PostCollectionScreen from "./PostCollectionScreen";

interface Props {
  navigation: NavigationScreenProp<any, any>;
  dispatch(action: Action): void;
  screenProps: any;
  surveyResponses?: Map<string, SurveyResponse>;
}

const participantName = "John Doe"; //TODO: read the name out of redux
const WereThereAdverse = PostCollectionQuestions.WereThereAdverse;
const WhichProcedures = PostCollectionQuestions.WhichProcedures;
@connect((state: StoreState) => ({
  surveyResponses: state.form!.surveyResponses,
}))
export default class AdverseScreen extends PostCollectionScreen<Props> {
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
              onPress={() => navigation.popToTop()}
              style={styles.actionContainer}
            >
              <Text style={styles.actionText}>Cancel</Text>
            </TouchableOpacity>
          ),
          headerRight: (
            <TouchableOpacity
              onPress={params._onNext}
              style={styles.actionContainer}
            >
              <Text style={styles.actionText}>Next</Text>
            </TouchableOpacity>
          ),
        };
  };
  componentWillMount() {
    this.props.navigation.setParams({
      _onNext: this._onNext,
    });
  }
  _adverseEventsOccurred = (): boolean => {
    return (
      !!this.props.surveyResponses &&
      !!this.props.surveyResponses.get(WereThereAdverse.id) &&
      !!this.props.surveyResponses.get(WereThereAdverse.id)!.answer!.options &&
      !!this.props.surveyResponses
        .get(WereThereAdverse.id)!
        .answer!.options!.get("Yes")
    );
  };
  _onNext = () => {
    if (this._adverseEventsOccurred()) {
      let options =
        this.props.surveyResponses!.has(WhichProcedures.id) &&
        !!this.props.surveyResponses!.get(WhichProcedures.id)!.answer
          ? this.props.surveyResponses!.get(WhichProcedures.id)!.answer!.options
          : null;
      if (
        !!options
          ? Array.from(options.values()).reduce(
              (result, value) => result || value,
              false
            )
          : false
      ) {
        this.props.navigation.push("AdverseDetails");
      } else {
        Alert.alert("Please specify which procedures had adverse events.");
      }
    } else {
      Alert.alert(
        "Submit?",
        `No adverse events will be recorded for this collection for ${participantName}.`,
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
        <Text style={styles.sectionHeaderText}>{WereThereAdverse.title}</Text>
        <OptionList
          data={this._getSelectedOptionMap(
            WereThereAdverse.id,
            WereThereAdverse.optionList,
            this.props.surveyResponses
          )}
          multiSelect={WereThereAdverse.optionList.multiSelect}
          numColumns={1}
          fullWidth={true}
          backgroundColor="#fff"
          onChange={data => {
            const [responses, existingAnswer] = this._getAndInitializeResponse(
              WereThereAdverse.id,
              WereThereAdverse.title,
              this.props.surveyResponses
            );
            responses.set(WereThereAdverse.id, {
              ...responses.get(WereThereAdverse.id),
              answer: { ...existingAnswer, options: data },
            });
            this.props.dispatch(setSurveyResponses(responses));
          }}
        />
        {this._adverseEventsOccurred() && (
          <View>
            <Text style={styles.sectionHeaderText}>
              {WhichProcedures.title}
            </Text>
            <OptionList
              data={this._getSelectedOptionMap(
                WhichProcedures.id,
                WhichProcedures.optionList,
                this.props.surveyResponses
              )}
              multiSelect={WhichProcedures.optionList.multiSelect}
              numColumns={1}
              fullWidth={true}
              backgroundColor="#fff"
              onChange={data => {
                const [
                  responses,
                  existingAnswer,
                ] = this._getAndInitializeResponse(
                  WhichProcedures.id,
                  WhichProcedures.title,
                  this.props.surveyResponses
                );
                responses.set(WhichProcedures.id, {
                  ...responses.get(WhichProcedures.id),
                  answer: { ...existingAnswer, options: data },
                });
                this.props.dispatch(setSurveyResponses(responses));
              }}
            />
          </View>
        )}
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
  actionText: {
    fontFamily: "System",
    fontSize: 17,
    color: "#007AFF",
    lineHeight: 22,
    letterSpacing: -0.41,
  },
});
