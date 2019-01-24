import React from "react";
import { StyleSheet, Text, TouchableOpacity } from "react-native";
import { WithNamespaces, withNamespaces } from "react-i18next";

interface Props {
  onPress(): void;
}

class FeedbackButton extends React.Component<Props & WithNamespaces> {
  render() {
    const { t } = this.props;
    return (
      <TouchableOpacity onPress={this.props.onPress}>
        <Text style={styles.actionText}>{t("provideFeedback")}</Text>
      </TouchableOpacity>
    );
  }
}

const styles = StyleSheet.create({
  actionText: {
    fontFamily: "System",
    fontSize: 17,
    color: "#007AFF",
    lineHeight: 22,
    letterSpacing: -0.41,
    paddingRight: 15,
  },
});

export default withNamespaces("feedbackButton")(FeedbackButton);
