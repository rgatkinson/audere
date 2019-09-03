// Copyright (c) 2019 by Audere
//
// Use of this source code is governed by an MIT-style license that
// can be found in the LICENSE file distributed with this file.

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
  body?: string;
  dismissText?: string;
  height: number;
  submitText?: string;
  title?: string;
  visible: boolean;
  width: number;
  onDismiss(): void;
  onSubmit(): void;
}

class Modal extends React.Component<Props & WithNamespaces> {
  render() {
    const {
      body,
      children,
      dismissText,
      height,
      submitText,
      t,
      title,
      visible,
      width,
      onDismiss,
      onSubmit,
    } = this.props;
    return (
      <AnimatedModal
        backdropOpacity={0.3}
        style={styles.modal}
        isVisible={visible}
        animationIn={IOS_MODAL_ANIMATION}
        animationOut={"fadeOut"}
      >
        <View style={[styles.modalContainer, { height, width }]}>
          <View style={styles.blur}>
            {title && <Text style={styles.title}>{title}</Text>}
            {body && <Text style={styles.body}>{body}</Text>}
            {children}
            <View style={styles.footer}>
              <TouchableOpacity onPress={onDismiss} style={styles.actionButton}>
                <Text style={styles.actionText}>
                  {dismissText ? dismissText : t("common:button:cancel")}
                </Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={onSubmit} style={styles.actionButton}>
                <Text
                  style={[styles.actionText, { textAlign: "right" }]}
                  accessibilityLabel={submitText}
                >
                  {submitText ? submitText : t("common:button:submit")}
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
