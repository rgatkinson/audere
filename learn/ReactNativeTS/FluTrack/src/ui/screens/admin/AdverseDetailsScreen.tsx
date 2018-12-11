import React from "react";
import { withNamespaces, WithNamespaces } from "react-i18next";
import { NavigationScreenProp } from "react-navigation";
import { Text, StyleSheet, View, Alert, TouchableOpacity } from "react-native";
import { Icon } from "react-native-elements";
import { connect } from "react-redux";
import { StoreState } from "../../../store";
import reduxWriter, { ReduxWriterProps } from "../../../store/ReduxWriter";
import { PostCollectionQuestions, OptionKeyToQuestion } from "./QuestionConfig";
import Button from "../../components/Button";
import FeedbackButton from "../../components/FeedbackButton";
import FeedbackModal from "../../components/FeedbackModal";
import OptionList, { newSelectedOptionsMap } from "../../components/OptionList";
import ScreenContainer from "../../components/ScreenContainer";
import { OptionListConfig } from "../../../resources/QuestionnaireConfig";

interface Props {
  name: string;
  navigation: NavigationScreenProp<any, any>;
  screenProps: any;
}

const WhichProcedures = PostCollectionQuestions.WhichProcedures;

@connect((state: StoreState) => ({
  name: state.form!.name,
}))
class AdverseDetailsScreen extends React.Component<Props & WithNamespaces & ReduxWriterProps> {
  static navigationOptions = ({ navigation }: { navigation: NavigationScreenProp<any, any>}) => {
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

  _eventsOccurred = (eventTypeKey: string): boolean => {
    const adverseProcedures = this.props.getAnswer("options", WhichProcedures.id);
    return !!adverseProcedures && adverseProcedures.has(eventTypeKey) && adverseProcedures.get(eventTypeKey);
  };

  _canSave = (): boolean => {
    const allValid = Object.keys(OptionKeyToQuestion)
      .filter(key => this._eventsOccurred(key))
      .map(key => {
        const options = this.props.getAnswer("options", OptionKeyToQuestion[key].id);
        return !!options && Array.from(options.values()).reduce((result, value) => result || value, false);
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
            this.props.navigation.popToTop();
          },
        },
      ]
    );
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
          .map(key => (OptionKeyToQuestion[key].optionList &&
            <View key={key}>
              <Text style={styles.sectionHeaderText}>
                {OptionKeyToQuestion[key].title}
              </Text>
              <OptionList
                backgroundColor="#fff"
                data={newSelectedOptionsMap(
                  OptionKeyToQuestion[key].optionList!.options,
                  this.props.getAnswer("options", OptionKeyToQuestion[key].id)
                )}
                fullWidth={true}
                multiSelect={OptionKeyToQuestion[key].optionList!.multiSelect}
                withOther={OptionKeyToQuestion[key].optionList!.withOther}
                numColumns={1}
                onOtherChange={value => this.props.updateAnswer({ otherOption: value }, OptionKeyToQuestion[key])}
                onChange={data => this.props.updateAnswer({ options: data }, OptionKeyToQuestion[key])}
              />
            </View>
          ))}
        }
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

export default reduxWriter(withNamespaces()(AdverseDetailsScreen));
