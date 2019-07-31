// Copyright (c) 2019 by Audere
//
// Use of this source code is governed by an MIT-style license that
// can be found in the LICENSE file distributed with this file.

import React, { MouseEvent } from "react";
import { Redirect } from "react-router-dom";
import * as Firebase from "firebase";

import { getApi } from "./api";
import "./LoggedInAs.css";

const firebase = (global as any).firebase as typeof Firebase;

export interface LoggedInAsProps {}

export interface LoggedInAsState {
  busy: boolean;
  user: Firebase.User | null;
}

export class LoggedInAs extends React.Component<
  LoggedInAsProps,
  LoggedInAsState
> {
  private unsubscribeAuth: () => void;

  constructor(props: LoggedInAsProps) {
    super(props);
    this.state = {
      busy: true,
      user: null
    };
    this.unsubscribeAuth = () => {};
  }

  componentDidMount() {
    this.unsubscribeAuth = firebase.auth().onAuthStateChanged(user => {
      this.setState({
        busy: false,
        user: user
      });
    });
  }

  componentWillUnmount() {
    this.unsubscribeAuth();
  }

  logout = async (e: MouseEvent) => {
    e.preventDefault();
    const api = getApi();
    this.setState({ busy: true });
    await api.logout();
  };

  whoAmI() {
    if (this.state.busy) {
      return "Loading...";
    } else if (this.state.user != null) {
      return (
        <div>
          <div>Logged in as:</div>
          <div>{this.state.user.email}</div>
        </div>
      );
    } else {
      return <Redirect to="/" />;
    }
  }

  render() {
    const { busy } = this.state;
    return (
      <div className="WhoAmI">
        {this.whoAmI()}
        <div>
          <button
            className="Logout"
            type="button"
            disabled={busy}
            onClick={this.logout}
          >
            Log out
          </button>
        </div>
      </div>
    );
  }
}
