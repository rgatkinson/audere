import React from "react";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";
import AnimatedModal from "react-native-modal";
import { WithNamespaces, withNamespaces } from "react-i18next";
import {
  BORDER_COLOR,
  EXTRA_SMALL_TEXT,
  GUTTER,
  TEXT_COLOR,
  SYSTEM_FONT,
  SYSTEM_TEXT,
} from "../styles";

const IOS_MODAL_ANIMATION = {
  from: { opacity: 0, scale: 1.2 },
  0.5: { opacity: 1 },
  to: { opacity: 1, scale: 1 },
};

interface Props {
  height: number;
  width: number;
  dismissText?: string;
  submitText?: string;
  title?: string;
  body?: string;
  visible: boolean;
  onDismiss(): void;
  onSubmit(): void;
}

class Modal extends React.Component<Props & WithNamespaces> {
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
        <View
          style={[
            styles.modalContainer,
            {
              height: this.props.height,
              width: this.props.width,
            },
          ]}
        >
          <View style={styles.blur}>
            {this.props.title ? (
              <Text style={styles.title}>{this.props.title}</Text>
            ) : null}
            {this.props.body ? (
              <Text style={styles.body}>{this.props.body}</Text>
            ) : null}
            {this.props.children}
            <View style={styles.footer}>
              <TouchableOpacity
                onPress={this.props.onDismiss}
                style={styles.actionButton}
              >
                <Text style={styles.actionText}>
                  {this.props.dismissText
                    ? this.props.dismissText
                    : t("common:button:cancel")}
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={this.props.onSubmit}
                style={styles.actionButton}
              >
                <Text
                  style={[styles.actionText, { textAlign: "right" }]}
                  accessibilityLabel={this.props.submitText}
                >
                  {this.props.submitText
                    ? this.props.submitText
                    : t("common:button:submit")}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </AnimatedModal>
    );
  }
}

const styles = StyleSheet.create({
  actionText: {
    fontFamily: SYSTEM_FONT,
    fontSize: SYSTEM_TEXT,
    color: TEXT_COLOR,
  },
  actionButton: {
    width: "50%",
    height: 44,
    alignItems: "center",
    justifyContent: "center",
    borderTopColor: BORDER_COLOR,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderLeftColor: BORDER_COLOR,
    borderLeftWidth: StyleSheet.hairlineWidth,
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
  footer: {
    alignItems: "center",
    position: "absolute",
    bottom: 0,
    opacity: 82,
    flexDirection: "row",
    justifyContent: "space-between",
    height: 44,
    width: "100%",
  },
  modal: {
    alignItems: "center",
  },
  modalContainer: {
    justifyContent: "center",
  },
  title: {
    alignSelf: "center",
    fontFamily: SYSTEM_FONT,
    fontSize: SYSTEM_TEXT,
    fontWeight: "600",
    paddingTop: GUTTER,
    paddingHorizontal: GUTTER,
    paddingBottom: GUTTER / 2,
    textAlign: "center",
  },
  body: {
    alignSelf: "center",
    fontFamily: SYSTEM_FONT,
    fontSize: EXTRA_SMALL_TEXT,
    paddingHorizontal: GUTTER,
    paddingBottom: GUTTER,
    textAlign: "center",
  },
});

export default withNamespaces()(Modal);
