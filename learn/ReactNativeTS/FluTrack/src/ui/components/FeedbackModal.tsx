import React from "react";
import {
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import AnimatedModal from "react-native-modal";
import { WithNamespaces, withNamespaces } from "react-i18next";

const IOS_MODAL_ANIMATION = {
  from: { opacity: 0, scale: 1.2 },
  0.5: { opacity: 1 },
  to: { opacity: 1, scale: 1 },
};

interface Props {
  visible: boolean;
  onDismiss(): void;
}

class FeedbackModal extends React.Component<Props & WithNamespaces> {
  state = {
    subject: undefined,
    comments: undefined,
  };

  render() {
    const { t } = this.props;
    return (
      <AnimatedModal
        backdropOpacity={0.3}
        style={styles.modal}
        isVisible={this.props.visible}
        animationIn={IOS_MODAL_ANIMATION}
        animationOut={"fadeOut"}
      >
        <View style={styles.modalContainer}>
          <View style={styles.blur}>
            <View style={styles.header}>
              <TouchableOpacity onPress={this.props.onDismiss}>
                <Text style={styles.actionText}>
                  {t("common:button:cancel")}
                </Text>
              </TouchableOpacity>
              <Text style={styles.title}>{t("provideFeedback")}</Text>
              <TouchableOpacity
                onPress={() => {
                  // TODO store in redux
                  // TODO clear state
                  this.props.onDismiss();
                }}
              >
                <Text style={styles.actionText}>
                  {t("common:button:submit")}
                </Text>
              </TouchableOpacity>
            </View>
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
        </View>
      </AnimatedModal>
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
  },
  blur: {
    backgroundColor: "white",
    borderRadius: 13,
    overflow: "hidden",
    position: "absolute",
    top: 0,
    left: 0,
    bottom: 0,
    right: 0,
  },
  comments: {
    flex: 1,
    marginVertical: 11,
  },
  header: {
    backgroundColor: "#F8F8F8",
    alignItems: "center",
    opacity: 82,
    flexDirection: "row",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    height: 44,
  },
  modal: {
    alignItems: "center",
  },
  modalContainer: {
    width: 540,
    height: 620,
    justifyContent: "center",
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
  title: {
    fontFamily: "System",
    fontSize: 17,
    fontWeight: "bold",
  },
});

export default withNamespaces("feedbackModal")<Props>(FeedbackModal);
