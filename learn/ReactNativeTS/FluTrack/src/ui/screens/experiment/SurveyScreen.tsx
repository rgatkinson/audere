import React from "react";
import {
  LayoutAnimation,
  SectionList,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { NavigationScreenProp } from "react-navigation";
import { questionnaire } from "./QuestionnaireConfig";
import Button from "./components/Button";
import SurveyQuestion from "./components/SurveyQuestion";
import StatusBar from "./components/StatusBar";

interface Props {
  navigation: NavigationScreenProp<any, any>;
}

export default class ScrollScreen extends React.Component<Props> {
  state = {
    completeness: 5,
    questions: [
      {
        title: questionnaire[0].section,
        data: [questionnaire[0].data],
      },
    ],
    currentItemIndex: 0,
  };

  _addData = () => {
    if (this.state.currentItemIndex === questionnaire.length - 1) {
      // Done already
      alert("nothing to add");
      return;
    }

    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);

    const item = questionnaire[this.state.currentItemIndex + 1];
    let questions = [...this.state.questions];
    const sectionIndex = questions.findIndex(obj => obj.title === item.section);
    const sectionExists = sectionIndex > -1;
    const sectionData = sectionExists ? questions[sectionIndex].data : [];
    questions[sectionExists ? sectionIndex : questions.length] = {
      title: item.section,
      data: [...sectionData, item.data],
    };
    this.setState({
      questions,
      currentItemIndex: this.state.currentItemIndex + 1,
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
        currentItemIndex: this.state.currentItemIndex - 1,
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
        currentItemIndex: this.state.currentItemIndex - 1,
      });
    }
  };

  _back = () => {
    this._removeData();
  };

  _next = () => {
    // TODO: implement next
  };

  render() {
    return (
      <View style={styles.container}>
        <StatusBar
          canProceed={false}
          progressPercent={this.state.completeness}
          title="Study Questionnaire"
          onBack={this._back}
          onForward={this._next}
        />
        <SectionList
          inverted
          contentContainerStyle={styles.list}
          keyExtractor={item => item.title}
          sections={this.state.questions}
          renderSectionHeader={({ section: { title } }) => (
            <View style={styles.sectionHeaderOuter}>
              <View style={styles.sectionHeader}>
                <Text style={styles.sectionHeaderText}>{title}</Text>
              </View>
            </View>
          )}
          renderItem={({ item, index, section }) => {
            const activeSection =
              this.state.questions[this.state.questions.length - 1].title ===
              section.title;
            const lastItem = section.data.length - 1 === index;
            return (
              <SurveyQuestion
                active={activeSection && lastItem}
                buttons={item.buttons}
                description={item.description}
                title={item.title}
                onNext={this._addData}
              />
            );
          }}
          extraData={this.state.questions}
          stickySectionHeadersEnabled={false}
        />
      </View>
    );
  }
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
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
    borderWidth: 4,
    height: 100,
    justifyContent: "center",
    margin: 10,
  },
  sectionHeaderOuter: {
    alignItems: "center",
    backgroundColor: "#d3d0af",
    justifyContent: "center",
    padding: 10,
  },
  sectionHeaderText: {
    fontSize: 24,
    textAlign: "center",
  },
});
