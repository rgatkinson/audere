// Copyright (c) 2019 by Audere
//
// Use of this source code is governed by an MIT-style license that
// can be found in the LICENSE file distributed with this file.

import React from "react";
import * as Firebase from "firebase";
import * as Firebaseui from "firebaseui";

const firebase = (global as any).firebase as typeof Firebase;
const firebaseui = (global as any).firebaseui as typeof Firebaseui;

export interface LoginProps {
  redirectTo: string;
}

export interface LoginState {}

export class LoginForm extends React.Component<LoginProps, LoginState> {
  uiConfig = {
    signInSuccessUrl: this.props.redirectTo,
    signInOptions: [firebase.auth.EmailAuthProvider.PROVIDER_ID],
  };

  componentDidMount() {
    const ui = new firebaseui.auth.AuthUI(firebase.auth());
    ui.start("#firebaseui-auth-container", this.uiConfig);
  }

  render() {
    return <div id="firebaseui-auth-container"></div>;
  }
}
