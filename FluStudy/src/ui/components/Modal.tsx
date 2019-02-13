import React from "react";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";
import AnimatedModal from "react-native-modal";
import { WithNamespaces, withNamespaces } from "react-i18next";
import {
  GUTTER,
  LINK_COLOR,
  STATUS_BAR_COLOR,
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
            <View style={styles.header}>
              <TouchableOpacity onPress={this.props.onDismiss}>
                <Text style={styles.actionText}>
                  {this.props.dismissText
                    ? this.props.dismissText
                    : t("common:button:cancel")}
                </Text>
              </TouchableOpacity>
              {this.props.title ? (
                <Text style={styles.title}>{this.props.title}</Text>
              ) : null}
              <TouchableOpacity onPress={this.props.onSubmit}>
                <Text style={[styles.actionText, { textAlign: "right" }]}>
                  {this.props.submitText
                    ? this.props.submitText
                    : t("common:button:submit")}
                </Text>
              </TouchableOpacity>
            </View>
            {this.props.children}
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
    color: LINK_COLOR,
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
  header: {
    backgroundColor: STATUS_BAR_COLOR,
    alignItems: "center",
    opacity: 82,
    flexDirection: "row",
    justifyContent: "space-between",
    paddingHorizontal: GUTTER,
    height: 44,
  },
  modal: {
    alignItems: "center",
  },
  modalContainer: {
    justifyContent: "center",
  },
  title: {
    fontFamily: SYSTEM_FONT,
    fontSize: SYSTEM_TEXT,
    fontWeight: "bold",
  },
});

export default withNamespaces()<Props>(Modal);
