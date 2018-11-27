import React from "react";
import {
  KeyboardAvoidingView,
  LayoutAnimation,
  SectionList,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { Action } from "../../../store";
import { NavigationScreenProp } from "react-navigation";
import { questionnaire, sectionDescriptions } from "./QuestionnaireConfig";
import Button from "./components/Button";
import Description from "./components/Description";
import SurveyQuestion from "./components/SurveyQuestion";
import StatusBar from "./components/StatusBar";

interface Props {
  dispatch(action: Action): void;
  navigation: NavigationScreenProp<any, any>;
}

export default class SurveyScreen extends React.Component<Props> {
  state = {
    questions: [
      {
        title: questionnaire[0].section,
        data: [questionnaire[0].data],
      },
    ],
  };

  _activateQuestion = (sectionTitle: string, questionIndex: number) => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    const sectionIndex = this.state.questions.findIndex(
      section => section.title === sectionTitle
    );
    if (this.state.questions[sectionIndex].data.length > questionIndex + 1) {
      this.setState({
        questions: [
          ...this.state.questions.slice(0, sectionIndex),
          {
            ...this.state.questions[sectionIndex],
            data: this.state.questions[sectionIndex].data.slice(
              0,
              questionIndex + 1
            ),
          },
        ],
      });
    } else {
      this.setState({
        questions: this.state.questions.slice(0, sectionIndex + 1),
      });
    }
  };

  _addData = (nextQuestion: string) => {
    if (!nextQuestion) {
      this.props.navigation.push("PassBack");
      return;
    }

    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);

    const item = questionnaire.find(
      question => question.data.id === nextQuestion
    );
    if (!item) {
      this.props.navigation.push("PassBack");
      return;
    }
    let questions = [...this.state.questions];
    const sectionIndex = questions.findIndex(obj => obj.title === item.section);
    const sectionExists = sectionIndex > -1;
    const sectionData = sectionExists ? questions[sectionIndex].data : [];
    questions[sectionExists ? sectionIndex : questions.length] = {
      title: item!.section,
      data: [...sectionData, item!.data],
    };
    this.setState({
      questions,
    });
  };

  _removeData = () => {
    const currentSectionIndex = this.state.questions.length - 1;
    const currentSectionItemIndex =
      this.state.questions[currentSectionIndex].data.length - 1;
    if (currentSectionItemIndex === 0) {
      // Remove entire section
      this.setState({
        questions: this.state.questions.slice(0, currentSectionIndex),
      });
    } else {
      // Remove last question
      this.setState({
        questions: [
          ...this.state.questions.slice(0, currentSectionIndex),
          {
            ...this.state.questions[currentSectionIndex],
            data: this.state.questions[currentSectionIndex].data.slice(
              0,
              currentSectionItemIndex
            ),
          },
        ],
      });
    }
  };

  _back = () => {
    if (this._getQuestionnaireIndex() === 0) {
      this.props.navigation.pop();
    } else {
      this._removeData();
    }
  };

  _next = () => {
    // TODO: implement next
  };

  _getQuestionnaireIndex = () => {
    const currentSection = this.state.questions[
      this.state.questions.length - 1
    ];
    const currentQuestion = currentSection.data[currentSection.data.length - 1];
    return questionnaire.findIndex(
      question => question.data.id === currentQuestion.id
    );
  };

  render() {
    return (
      <KeyboardAvoidingView style={styles.container} behavior="padding" enabled>
        <StatusBar
          canProceed={false}
          progressNumber={
            Math.round(
              (100.0 * this._getQuestionnaireIndex()) / questionnaire.length
            ) + "%"
          }
          progressLabel="Complete"
          title="Study Questionnaire"
          onBack={this._back}
          onForward={this._next}
        />
        <SectionList
          inverted
          initialNumToRender={questionnaire.length + 10}
          contentContainerStyle={styles.list}
          keyExtractor={item => item.title}
          sections={this.state.questions}
          renderSectionHeader={({ section: { title } }) => (
            <View>
              <View style={styles.sectionHeaderOuter}>
                <View style={styles.sectionHeader}>
                  <Text style={styles.sectionHeaderText}>{title}</Text>
                </View>
              </View>
              {sectionDescriptions.has(title) && (
                <View style={styles.descContainer}>
                  <Description content={sectionDescriptions.get(title)!} />
                </View>
              )}
            </View>
          )}
          renderItem={({ item, index, section }) => {
            const activeSection =
              this.state.questions[this.state.questions.length - 1].title ===
              section.title;
            const lastItem = section.data.length - 1 === index;
            return (
              <SurveyQuestion
                id={item.id}
                active={activeSection && lastItem}
                addressInput={item.addressInput}
                buttons={item.buttons}
                dateInput={item.dateInput}
                conditionalNext={item.conditionalNext}
                dispatch={this.props.dispatch}
                description={item.description}
                title={item.title}
                nextQuestion={item.nextQuestion}
                numberInput={item.numberInput}
                optionList={item.optionList}
                textInput={item.textInput}
                onActivate={() => this._activateQuestion(section.title, index)}
                onNext={(nextQuestion: string) => this._addData(nextQuestion)}
              />
            );
          }}
          extraData={this.state.questions}
          stickySectionHeadersEnabled={false}
        />
      </KeyboardAvoidingView>
    );
  }
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  descContainer: {
    marginBottom: -20,
    marginHorizontal: 50,
    marginTop: 20,
  },
  list: {
    flexDirection: "column-reverse",
    justifyContent: "flex-end",
  },
  sectionHeader: {
    alignItems: "center",
    alignSelf: "stretch",
    backgroundColor: "#d3d0af",
    borderColor: "white",
    borderWidth: 3,
    height: 100,
    justifyContent: "center",
  },
  sectionHeaderOuter: {
    alignItems: "center",
    backgroundColor: "#d3d0af",
    justifyContent: "center",
    padding: 20,
  },
  sectionHeaderText: {
    fontSize: 24,
    textAlign: "center",
  },
});
