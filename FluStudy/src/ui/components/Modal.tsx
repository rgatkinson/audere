import React from "react";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";
import AnimatedModal from "react-native-modal";
import { WithNamespaces, withNamespaces } from "react-i18next";

const IOS_MODAL_ANIMATION = {
  from: { opacity: 0, scale: 1.2 },
  0.5: { opacity: 1 },
  to: { opacity: 1, scale: 1 },
};

interface Props {
  height?: number;
  width?: number;
  dismissText?: string;
  submitText?: string;
  title?: string;
  visible: boolean;
  onDismiss(): void;
  onSubmit?(): void;
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
              height: this.props.height ? this.props.height : 620,
              width: this.props.width ? this.props.width : 540,
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
              {this.props.onSubmit ? (
                <TouchableOpacity onPress={this.props.onSubmit}>
                  <Text style={[styles.actionText, { textAlign: "right" }]}>
                    {this.props.submitText
                      ? this.props.submitText
                      : t("common:button:submit")}
                  </Text>
                </TouchableOpacity>
              ) : (
                <View style={{ width: 100 }} />
              )}
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
    fontFamily: "System",
    fontSize: 17,
    color: "#007AFF",
    lineHeight: 22,
    letterSpacing: -0.41,
    width: 100,
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
    justifyContent: "center",
  },
  title: {
    fontFamily: "System",
    fontSize: 17,
    fontWeight: "bold",
  },
});

export default withNamespaces()<Props>(Modal);
