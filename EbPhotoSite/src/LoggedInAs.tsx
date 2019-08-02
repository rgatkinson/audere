// Copyright (c) 2019 by Audere
//
// Use of this source code is governed by an MIT-style license that
// can be found in the LICENSE file distributed with this file.

import React, { MouseEvent } from "react";
import { Redirect } from "react-router-dom";
import * as Firebase from "firebase";

import { getApi } from "./api";
import profileImage from "./img/userprofile.png";
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
          <div className="UserWelcome">Welcome,</div>
          <div className="UserName">{this.state.user.email}</div>
        </div>
      );
    } else {
      return <Redirect to="/" />;
    }
  }

  render() {
    const { busy } = this.state;
    return (
      <div>
        <table>
          <tr>
            <td>
              {this.state.user !== null && (
                <div
                  className="ProfileImage"
                  style={{
                    clear: "none"
                  }}
                >
                  <img src={profileImage} />
                </div>
              )}
            </td>
            <td>
              <div className="WhoAmI">
                {this.whoAmI()}
                {this.state.user !== null && (
                  <div className="Logout" onClick={this.logout}>
                    Logout
                  </div>
                )}
              </div>
            </td>
          </tr>
        </table>
      </div>
    );
  }
}
