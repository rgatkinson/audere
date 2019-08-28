// Copyright (c) 2019 by Audere
//
// Use of this source code is governed by an MIT-style license that
// can be found in the LICENSE file distributed with this file.

import React, { Fragment } from "react";
import { StyleSheet, View } from "react-native";
import firebase from "react-native-firebase";
import { Message } from "audere-lib/ebPhotoStoreProtocol";
import Text from "./Text";
import { WithNamespaces, withNamespaces } from "react-i18next";
import {
  CHAT_LOCAL_MESSAGE_COLOR,
  CHAT_REMOTE_MESSAGE_COLOR,
  GUTTER,
  SMALL_TEXT,
  LIGHT_COLOR,
} from "../styles";

interface Props {
  messages: Message[];
}

export default class Chat extends React.Component<Props> {
  _chatMessages: any = [];

  render() {
    const { messages } = this.props;
    const uid = firebase.auth().currentUser!.uid;
    return (
      <Fragment>
        {[...messages]
          .sort((a, b) => a.timestamp.localeCompare(b.timestamp))
          .map((message, index) => (
            <TranslatedChatMessage
              ref={(tcm: ChatMessage) => (this._chatMessages[index] = tcm)}
              key={message.sender.uid + message.timestamp}
              local={message.sender.uid === uid}
              message={message}
            />
          ))}
      </Fragment>
    );
  }

  getChatMessage(msg: Message): any {
    return this._chatMessages.find((tcm: ChatMessage) => {
      if (tcm.props.message === msg) {
        return tcm;
      }
    });
  }
}

interface MessageProps {
  local: boolean;
  message: Message;
  ref: any;
}

class ChatMessage extends React.Component<MessageProps & WithNamespaces> {
  _convertDate = (date: Date) => {
    let hours = date.getHours();
    let minutes = date.getMinutes().toString();
    let ampm = hours >= 12 ? "PM" : "AM";
    hours = hours % 12;
    hours = hours ? hours : 12;
    minutes = parseInt(minutes) < 10 ? "0" + minutes : minutes;
    var strTime = hours + ":" + minutes + " " + ampm;
    return strTime;
  };

  render() {
    const { local, message, ref, t } = this.props;
    return (
      <Fragment>
        <View
          style={{
            flexDirection: "row",
            justifyContent: local ? "flex-end" : "flex-start",
          }}
        >
          {!local && (
            <Text
              content={message.sender.name}
              italic={true}
              style={styles.sender}
            />
          )}
          <Text
            content={t("dateTime", {
              date: this._convertDate(new Date(message.timestamp)),
            })}
            italic={true}
            style={[styles.sender, styles.date, local && styles.local]}
          />
        </View>
        <Text
          content={message.content}
          ref={ref}
          style={[
            styles.message,
            local && styles.local,
            local ? styles.localMessage : styles.foreignMessage,
          ]}
        />
      </Fragment>
    );
  }
}
const TranslatedChatMessage = withNamespaces("common")(ChatMessage);

const styles = StyleSheet.create({
  date: {
    color: LIGHT_COLOR,
  },
  message: {
    borderRadius: 10,
    padding: GUTTER / 2,
  },
  foreignMessage: {
    alignSelf: "flex-start",
    backgroundColor: CHAT_REMOTE_MESSAGE_COLOR,
  },
  local: {
    textAlign: "right",
  },
  localMessage: {
    alignSelf: "flex-end",
    backgroundColor: CHAT_LOCAL_MESSAGE_COLOR,
  },
  sender: {
    marginTop: GUTTER,
    paddingHorizontal: GUTTER / 4,
    marginVertical: GUTTER / 4,
  },
});
