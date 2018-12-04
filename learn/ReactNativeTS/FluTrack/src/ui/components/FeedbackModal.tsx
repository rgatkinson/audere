import React from "react";
import {
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { connect } from "react-redux";
import { WithNamespaces, withNamespaces } from "react-i18next";
import Modal from "./Modal";
import { Action, addFeedback, StoreState } from "../../store";

const IOS_MODAL_ANIMATION = {
  from: { opacity: 0, scale: 1.2 },
  0.5: { opacity: 1 },
  to: { opacity: 1, scale: 1 },
};

interface Props {
  visible: boolean;
  onDismiss(): void;
}

interface DispatchProps {
  dispatch(action: Action): void;
}

class FeedbackModal extends React.Component<Props & WithNamespaces & DispatchProps> {
  state = {
    subject: undefined,
    comments: undefined,
  };

  render() {
    const { t } = this.props;
    return (
      <Modal
        title={t("provideFeedback")}
        visible={this.props.visible}
        onDismiss={this.props.onDismiss}
        onSubmit={() => {
          this.props.dispatch(addFeedback(
            ((this.state.subject ? this.state.subject : "") + " " + (this.state.comments ? this.state.comments : "")).trim()
          ));
          this.setState({
            subject: undefined,
            comments: undefined,
          });
          this.props.onDismiss();
        }}
      >
        <View style={{ flex: 1 }}>
          <TextInput
            style={[styles.text, styles.subject]}
            placeholder={t("subject")}
            value={this.state.subject}
            onChangeText={text => this.setState({ subject: text })}
          />
          <TextInput
            style={[styles.text, styles.comments]}
            multiline={true}
            placeholder={t("comments")}
            value={this.state.comments}
            onChangeText={text => this.setState({ comments: text })}
          />
        </View>
      </Modal>
    );
  }
}

const styles = StyleSheet.create({
  comments: {
    flex: 1,
    marginVertical: 11,
  },
  subject: {
    justifyContent: "center",
    height: 44,
    borderBottomColor: "#bbb",
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  text: {
    paddingHorizontal: 22,
    fontSize: 17,
    letterSpacing: -0.41,
    lineHeight: 22,
  },
});

export default connect()(withNamespaces("feedbackModal")(FeedbackModal));
