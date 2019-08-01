// Copyright (c) 2019 by Audere
//
// Use of this source code is governed by an MIT-style license that
// can be found in the LICENSE file distributed with this file.

import React from "react";
import { DocumentType, Message, Notification, NotificationType } from "audere-lib/dist/ebPhotoStoreProtocol";
import { getApi } from "./api";
import * as Firebase from "firebase";
import "./Chat.css";

const firebase = (global as any).firebase as typeof Firebase;

export interface ChatProps {
  localIndex: string;
  parentDocId: string;
  phone: string;
}

export interface ChatState {
  input: string;
  currentUser: Firebase.User | null;
  messages: Message[];
  busy: boolean;
}

export class Chat extends React.Component<ChatProps, ChatState> {
  private unsubscribeAuth: () => void;
  private unsubscribeMessages: () => void;

  constructor(props: ChatProps) {
    super(props);

    this.state = {
      input: "",
      currentUser: null,
      messages: [],
      busy: true
    };

    this.unsubscribeAuth = () => {};
    this.unsubscribeMessages = () => {};
  }

  componentDidMount() {
    this.unsubscribeAuth = firebase.auth().onAuthStateChanged(user => {
      this.setState({
        busy: false,
        currentUser: user
      });
    });

    const api = getApi();
    const collection = api.getMessagesReference(this.props.parentDocId);
    this.unsubscribeMessages = collection.onSnapshot(collection => {
      const messages = collection.docs.map(d => d.data() as Message);
      this.setState({ messages: messages });
    });
  }

  componentWillUnmount() {
    this.unsubscribeAuth();
    this.unsubscribeMessages();
  }

  onChange(e: any) {
    this.setState({ input: e.target.value});
  }

  async onSubmit(e: any) {
    e.preventDefault();
    const { currentUser, input } = this.state;

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
          notificationType: NotificationType.Chat
        };

        await api.pushNotification(
          doc.token,
          "New chat message",
          input,
          details,
          "chw_chat"
        );
      } else {
        console.warn(`No registration token found for phone number ${phone}, ` +
          `no notification of triage will be sent`);
      }
    }

    this.setState({ input: ""});
  }

  private monthNames = ["January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December"
  ];

  renderMessage(message: Message) {
    const { content, sender, timestamp } = message;
    const { currentUser } = this.state;
    let userTag = sender.name;

    if (timestamp != null) {
      const date = new Date(timestamp);

      if (date != null) {
        let hours = date.getHours();
        const ampm = hours >= 12 ? "pm" : "am";
        hours = hours % 12;
        hours = hours === 0 ? 12 : hours;
        const dateString = date.getDate() + " " +
          this.monthNames[date.getMonth()] + " " +
          date.getFullYear() + ", " +
          hours + ":" +
          date.getMinutes() + " " +
          ampm;
        
        if (userTag != null) {
          userTag = ` by ${userTag}`;
        }

        userTag = dateString + userTag;
      }
    }
    const fromMe = currentUser != null && sender.uid === currentUser.uid;
    let className = "message";
    if (fromMe) {
      className += " current-user";
    }
    return (
      <li className={className}>
        <div className="message-content">
          <div className="text">{content}</div>
          <div className="user-name">
            {userTag}
          </div>
        </div>
      </li>
    )
  }

  render() {
    const { busy, messages } = this.state;
    return (
      <div>
        <p className="chat-title">Chat with community health worker:</p>
        <div className="chat-box">
          <ul className="message-list">
            {messages
              .sort((a, b) => (a.timestamp < b.timestamp ? -1 : 1))
              .map(m => this.renderMessage(m))}
          </ul>
          <form className="chat-form" onSubmit={e => this.onSubmit(e)}>
            <input className="chat-input" onChange={e => this.onChange(e)} value={this.state.input} type="text"/>
            <button className="chat-button" disabled={busy}>Send</button>
          </form>
        </div>
      </div>
    )
  }
}
