import React from "react";
import { Alert, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { Icon } from "react-native-elements";
import { NavigationScreenProp } from "react-navigation";
import FeedbackModal from "./FeedbackModal";

interface Props {
  navigation: NavigationScreenProp<any, any>;
  completedSurvey?: boolean;
}

export default class HeaderBar extends React.Component<Props> {
  state = {
    feedbackVisible: false,
  };

  _toHome = () => {
    // TODO: Mark survey as completed
    this.props.navigation.popToTop();
  };

  _toHomeWarn = () => {
    // TODO: log cancellation, clear form
    Alert.alert(
      "Exit Survey?",
      "Returning to Home will discard all responses.",
      [
        {
          text: "Discard",
          onPress: () => {
            this.props.navigation.popToTop();
          },
          style: "destructive",
        },
        { text: "Continue", onPress: () => {} },
      ]
    );
  };

  render() {
    return (
      <View>
        <FeedbackModal
          visible={this.state.feedbackVisible}
          onDismiss={() => this.setState({ feedbackVisible: false })}
        />
        <View style={styles.container}>
          <TouchableOpacity
            onPress={
              this.props.completedSurvey ? this._toHome : this._toHomeWarn
            }
            style={styles.actionContainer}
          >
            <Icon
              name="chevron-left"
              color="#007AFF"
              size={30}
              type="feather"
            />
            <Text style={styles.actionText}>
              {this.props.completedSurvey ? "Return to Home" : "Exit Study"}
            </Text>
          </TouchableOpacity>
          <Text style={styles.title}>Welcome</Text>
          <TouchableOpacity
            onPress={() => this.setState({ feedbackVisible: true })}
          >
            <Text style={styles.actionText}>Provide Feedback</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }
}

const styles = StyleSheet.create({
  actionContainer: {
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
  container: {
    alignItems: "center",
    backgroundColor: "#EEEEEE",
    borderBottomColor: "#bbb",
    borderBottomWidth: StyleSheet.hairlineWidth,
    flexDirection: "row",
    height: 70,
    justifyContent: "space-between",
    paddingTop: 20,
    paddingHorizontal: 8,
  },
  title: {
    fontFamily: "System",
    fontSize: 17,
    fontWeight: "bold",
  },
});
