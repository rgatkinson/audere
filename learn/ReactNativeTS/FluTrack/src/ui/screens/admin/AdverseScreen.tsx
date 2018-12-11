import React from "react";
import { withNamespaces, WithNamespaces } from "react-i18next";
import { Text, StyleSheet, View, Alert, TouchableOpacity } from "react-native";
import { NavigationScreenProp } from "react-navigation";
import { connect } from "react-redux";
import { StoreState, SurveyResponse } from "../../../store";
import reduxWriter, { ReduxWriterProps } from "../../../store/ReduxWriter";
import { PostCollectionQuestions } from "./QuestionConfig";
import FeedbackButton from "../../components/FeedbackButton";
import FeedbackModal from "../../components/FeedbackModal";
import OptionList, { newSelectedOptionsMap } from "../../components/OptionList";
import ScreenContainer from "../../components/ScreenContainer";
import { OptionListConfig } from "../../../resources/QuestionnaireConfig";
import Button from "../../components/Button";

interface Props {
  navigation: NavigationScreenProp<any, any>;
  name: string;
  screenProps: any;
}

const WereThereAdverse = PostCollectionQuestions.WereThereAdverse;
const WhichProcedures = PostCollectionQuestions.WhichProcedures;

@connect((state: StoreState) => ({
  name: state.form.name,
}))
class AdverseScreen extends React.Component<Props & WithNamespaces & ReduxWriterProps> {
  static navigationOptions = ({ navigation }: { navigation: NavigationScreenProp<any, any> }) => {
    const { params = null } = navigation.state;
    return {
      title: "Adverse Events",
      headerBackTitle: "Back",
      headerRight: (!!params ?
        <FeedbackButton onPress={params.showFeedback} />
        : null
      ),
    };
  };

  state = {
    feedbackVisible: false,
  };

  componentDidMount() {
    this.props.navigation.setParams({
      showFeedback: () => this.setState({ feedbackVisible: true }),
    });
  }

  _adverseEventsOccurred = (key: string): boolean => {
    const adverseEvents: Map<string, boolean> = this.props.getAnswer("options", WereThereAdverse.id);
    return !!adverseEvents && adverseEvents.has(key) && !!adverseEvents.get(key);
  };

  _adverseProceduresSelected = (): boolean => {
    const adverseProcedures: Map<string, boolean> = this.props.getAnswer("options", WhichProcedures.id);
    return !!adverseProcedures &&
      Array.from(adverseProcedures.values()).reduce((result, value) => result || value, false);
  };

  _onNext = () => {
    if (this._adverseEventsOccurred("yes")) {
      this.props.navigation.push("AdverseDetails");
    } else {
      Alert.alert(
        "Submit?",
        `No adverse events will be recorded for this collection for ${this.props.name}.`,
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
        <FeedbackModal
          visible={this.state.feedbackVisible}
          onDismiss={() => this.setState({ feedbackVisible: false })}
        />
        <Text style={styles.sectionHeaderText}>{WereThereAdverse.title}</Text>
        <OptionList
          backgroundColor="#fff"
          data={newSelectedOptionsMap(
            WereThereAdverse.optionList.options,
            this.props.getAnswer("options", WereThereAdverse.id),
          )}
          fullWidth={true}
          multiSelect={WereThereAdverse.optionList.multiSelect}
          numColumns={1}
          onChange={data => this.props.updateAnswer({ options: data }, WereThereAdverse)}
        />
        {this._adverseEventsOccurred("yes") && (
          <View>
            <Text style={styles.sectionHeaderText}>
              {WhichProcedures.title}
            </Text>
            <OptionList
              backgroundColor="#fff"
              data={newSelectedOptionsMap(
                WhichProcedures.optionList.options,
                this.props.getAnswer("options", WhichProcedures.id),
              )}
              fullWidth={true}
              multiSelect={WhichProcedures.optionList.multiSelect}
              numColumns={1}
              onChange={data => this.props.updateAnswer({ options: data }, WhichProcedures)}
            />
          </View>
        )}
        <View style={styles.buttonContainer}>
          <Button
            enabled={(
              this._adverseEventsOccurred("no") ||
              (this._adverseEventsOccurred("yes") && this._adverseProceduresSelected())
            )}
            key="next"
            label="Next"
            primary={true}
            onPress={this._onNext}
          />
        </View>
      </ScreenContainer>
    );
  }
}

const styles = StyleSheet.create({
  buttonContainer: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  sectionHeaderText: {
    marginTop: 35,
    marginBottom: 7,
    marginLeft: 15,
    fontSize: 24,
  },
});

export default reduxWriter(withNamespaces()(AdverseScreen));
