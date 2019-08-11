// Copyright (c) 2019 by Audere
//
// Use of this source code is governed by an MIT-style license that
// can be found in the LICENSE file distributed with this file.

import React, { RefObject } from "react";
import { format } from "date-fns";
import {
  DocumentType,
  Message,
  Notification,
  NotificationType,
} from "audere-lib/dist/ebPhotoStoreProtocol";
import { getApi } from "./api";
import * as Firebase from "firebase";
import "./Chat.css";

const firebase = (global as any).firebase as typeof Firebase;

export interface ChatProps {
  localIndex: string;
  parentDocId: string;
  phone: string;
  chwUid: string;
  messages: Message[];
  lastSeenTimestamp: string;
  onSawLatest: (timestamp: string) => any;
}

export interface ChatState {
  input: string;
  currentUser: Firebase.User | null;
  busy: boolean;
}

export class Chat extends React.Component<ChatProps, ChatState> {
  private unsubscribeAuth: () => void;
  private afterLastMessage: RefObject<HTMLDivElement>;

  constructor(props: ChatProps) {
    super(props);

    this.state = {
      input: "",
      currentUser: null,
      busy: true,
    };

    this.unsubscribeAuth = () => {};
    this.afterLastMessage = React.createRef();
  }

  componentDidMount() {
    this.unsubscribeAuth = firebase.auth().onAuthStateChanged(user => {
      this.setState({
        busy: false,
        currentUser: user,
      });
    });
  }

  componentDidUpdate() {
    const { lastSeenTimestamp, messages } = this.props;
    const latestTimestamp =
      messages.length > 0 ? messages[messages.length - 1].timestamp : "";
    debug(
      `CHAT: componentDidUpdate count=${messages.length} lastSeen=${lastSeenTimestamp} latest=${latestTimestamp}`
    );
    if (messages.length > 0 && lastSeenTimestamp !== latestTimestamp) {
      this.scrollToLatest();
    }
  }

  componentWillUnmount() {
    this.unsubscribeAuth();
  }

  onChange = (e: any) => {
    this.setState({ input: e.target.value });
    this.scrollToLatest();
  };

  async onSubmit(e: any) {
    e.preventDefault();
    const { currentUser, input } = this.state;
    this.setState({ input: "" });

    if (currentUser != null && input != null && input.trim().length > 0) {
      const { localIndex, parentDocId, phone } = this.props;
      const api = getApi();
      await api.sendMessage(this.props.parentDocId, currentUser, input);

      const doc = await api.getRegistrationToken(phone);

      if (doc != null && doc.token != null) {
        const details: Notification = {
          documentType: DocumentType.Notification,
          schemaId: 1,
          localIndex: localIndex,
          docId: parentDocId,
          notificationType: NotificationType.Chat,
        };

        await api.pushNotification(
          doc.token,
          `Message from ${currentUser.displayName}`,
          input,
          details,
          "chw_chat"
        );
      } else {
        console.warn(
          `No registration token found for phone number ${phone}, ` +
            `no notification of triage will be sent`
        );
      }
    }

    this.scrollToLatest();
  }

  scrollToLatest = () => {
    debug("CHAT: scrollToLatest");
    const last = this.afterLastMessage.current;
    if (last != null) {
      debug("  ...scrolling");
      last.scrollIntoView({ behavior: "smooth" });
    }
    this.sawLatest();
  };

  sawLatest() {
    debug("CHAT: sawLatest");
    const { messages } = this.props;
    if (messages.length > 0) {
      debug("  ...firing event");
      const latest = messages[messages.length - 1];
      this.props.onSawLatest(latest.timestamp);
    }
  }

  renderMessage(message: Message) {
    const { content, sender, timestamp } = message;
    const { currentUser } = this.state;
    let userTag = sender.name;

    if (timestamp != null) {
      const date = new Date(timestamp);

      if (date != null) {
        const dateString = format(date, "DD MMMM YYYY, HH:mm");

        if (userTag != null) {
          userTag = ` by ${userTag}`;
        }

        userTag = dateString + userTag;
      }
    }
    const fromMe = currentUser != null && sender.uid === currentUser.uid;
    const fromChw = sender.uid === this.props.chwUid;
    let className = "message";
    if (fromMe) {
      className += " current-user";
    } else if (!fromChw) {
      className += " other-admin";
    }
    return (
      <li className={className} key={`${timestamp}-${sender}`}>
        <div className="message-content">
          <div className="text">{content}</div>
          <div className="user-name">{userTag}</div>
        </div>
      </li>
    );
  }

  render() {
    const { messages } = this.props;
    return (
      <div>
        <p className="chat-title">Chat with community health worker:</p>
        <div className="chat-box">
          <ul className="message-list">
            {messages
              .sort((a, b) => (a.timestamp < b.timestamp ? -1 : 1))
              .map(m => this.renderMessage(m))}
            <div
              style={{ float: "left", clear: "both" }}
              ref={this.afterLastMessage}
            />
          </ul>
          <form className="chat-form" onSubmit={e => this.onSubmit(e)}>
            <input
              className="chat-input"
              placeholder="Enter a note to send to the clinic CHW"
              onChange={this.onChange}
              onClick={this.scrollToLatest}
              value={this.state.input}
              type="text"
            />
          </form>
        </div>
      </div>
    );
  }
}

function debug(message: string) {
  if (false) {
    debug(message);
  }
}
