// Copyright (c) 2019 by Audere
//
// Use of this source code is governed by an MIT-style license that
// can be found in the LICENSE file distributed with this file.
import React, { Component } from "react";
import {
  findNodeHandle,
  ScrollView,
  StyleSheet,
  View,
  KeyboardAvoidingView,
} from "react-native";
import firebase from "react-native-firebase";
import { connect } from "react-redux";
import { WithNamespaces, withNamespaces } from "react-i18next";
import { Action, sendChatMessage, StoreState } from "../store";
import { HealthWorkerInfo, Message } from "audere-lib/ebPhotoStoreProtocol";
import { GUTTER } from "./styles";
import TextInput from "./components/TextInput";
import Chat from "./components/Chat";
import Text from "./components/Text";

interface Props {
  dispatch(action: Action): void;
  firstName: string;
  lastName: string;
  healthWorkerInfo: HealthWorkerInfo;
  id: number;
  messages?: Message[];
  oldestUnreadChatMessage?: Message | null;
  patientExists: boolean;
}

interface State {
  chatMessage?: string;
}

class Messages extends Component<Props & WithNamespaces, State> {
  _lastNameInput: any;
  _phoneInput: any;
  _detailsInput: any;
  _notesInput: any;
  _scrollView: any;
  _chat: any;

  _didScrollToMostRecentMessage: boolean = false;

  constructor(props: Props & WithNamespaces) {
    super(props);
    this.state = { chatMessage: undefined };
    this._chat = React.createRef<Chat>();
    this._scrollView = React.createRef<ScrollView>();
  }

  _updateChatMessage = (chatMessage: string) => {
    this.setState({ chatMessage });
  };

  _sendChatMessage = () => {
    if (!this.state.chatMessage) {
      return;
    }

    const message: Message = {
      timestamp: firebase.firestore.Timestamp.now()
        .toDate()
        .toISOString(),
      sender: {
        uid: firebase.auth().currentUser!.uid,
        name:
          this.props.healthWorkerInfo.firstName +
          " " +
          this.props.healthWorkerInfo.lastName,
      },
      content: this.state.chatMessage,
    };
    this.props.dispatch(sendChatMessage(this.props.id, message));
    this.setState({ chatMessage: undefined });
  };

  _scrollToMostRecentMessageIfNeeded = () => {
    if (
      !this.props.oldestUnreadChatMessage ||
      this._didScrollToMostRecentMessage
    ) {
      return;
    }

    const msg =
      this._chat.current &&
      this._chat.current.getChatMessage(this.props.oldestUnreadChatMessage);
    const msgh = msg && findNodeHandle(msg);
    msgh && this._scrollView.current!.scrollToEnd({ animated: true });
    this._didScrollToMostRecentMessage = true;
  };

  render() {
    const { firstName, lastName, messages, patientExists, t } = this.props;
    const { chatMessage } = this.state;

    return (
      <KeyboardAvoidingView style={styles.container} behavior="padding">
        {patientExists && (
          <Text
            style={styles.chatDescription}
            content={t("startChat", { firstName, lastName })}
          />
        )}
        <ScrollView
          keyboardShouldPersistTaps={"handled"}
          ref={this._scrollView}
          onContentSizeChange={(w, h) => {
            this._scrollToMostRecentMessageIfNeeded();
          }}
          onLayout={ev => {
            this._scrollToMostRecentMessageIfNeeded();
          }}
          contentContainerStyle={styles.content}
        >
          {!!messages && <Chat ref={this._chat} messages={messages} />}
        </ScrollView>
        {patientExists ? (
          <View>
            <TextInput
              icon={{ uri: "right_arrow" }}
              value={chatMessage}
              multiline={true}
              numberOfLines={2}
              onChangeText={this._updateChatMessage}
              onIconPress={this._sendChatMessage}
              placeholder={t("chatPlaceholder")}
              returnKeyType="done"
              textStyle={styles.titleRow}
            />
          </View>
        ) : (
          <Text content={t("noPatient")} style={styles.noPatient} />
        )}
      </KeyboardAvoidingView>
    );
  }
}

function getOldestUnreadChatMessage(
  state: StoreState,
  props: Props
): Message | null {
  let oldestUnread = null;
  if (props.id < state.patients.length) {
    let oldestTime = new Date().getTime();
    state.patients[props.id].messages.map(message => {
      if (message.sender.uid !== firebase.auth().currentUser!.uid) {
        let msgTime = new Date(message.timestamp).getTime();
        if (
          msgTime > state.patients[props.id].messageLastViewedAt &&
          msgTime < oldestTime
        ) {
          oldestTime = msgTime;
          oldestUnread = message;
        }
      }
    });
  }
  return oldestUnread;
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: GUTTER,
  },
  chatDescription: {
    paddingLeft: GUTTER,
  },
  content: {
    flexDirection: "column",
    justifyContent: "flex-end",
  },
  noPatient: {
    marginBottom: GUTTER,
  },
  titleRow: {
    paddingTop: GUTTER,
    paddingBottom: GUTTER / 4,
  },
});

export default connect((state: StoreState, props: Props) => ({
  healthWorkerInfo: state.meta.healthWorkerInfo,
  firstName:
    state.patients &&
    state.patients[props.id] &&
    state.patients[props.id].patientInfo.firstName,
  lastName:
    state.patients &&
    state.patients[props.id] &&
    state.patients[props.id].patientInfo.lastName,
  messages: state.patients
    ? props.id < state.patients.length
      ? state.patients[props.id].messages || []
      : []
    : [],
  oldestUnreadChatMessage:
    props.oldestUnreadChatMessage !== undefined ||
    getOldestUnreadChatMessage(state, props),
  patientExists: state.patients && !!state.patients[props.id],
}))(withNamespaces("messages")(Messages));
