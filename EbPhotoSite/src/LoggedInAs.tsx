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
import { WithNamespaces, withNamespaces } from "react-i18next";

const firebase = (global as any).firebase as typeof Firebase;

export interface LoggedInAsProps extends WithNamespaces {}

export interface LoggedInAsState {
  busy: boolean;
  user: Firebase.User | null;
}

class LoggedInAs extends React.Component<LoggedInAsProps, LoggedInAsState> {
  private unsubscribeAuth: () => void;

  constructor(props: LoggedInAsProps) {
    super(props);
    this.state = {
      busy: true,
      user: null,
    };
    this.unsubscribeAuth = () => {};
  }

  componentDidMount() {
    this.unsubscribeAuth = firebase.auth().onAuthStateChanged(user => {
      this.setState({
        busy: false,
        user: user,
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
    const { t } = this.props;
    if (this.state.busy) {
      return t("common:loading");
    } else if (this.state.user != null) {
      return (
        <div>
          <div className="UserWelcome">{t("welcome")}</div>
          <div className="UserName">{this.state.user.email}</div>
        </div>
      );
    } else {
      return <Redirect to="/" />;
    }
  }

  render() {
    const { t } = this.props;
    return (
      <div>
        <table>
          <tbody>
            <tr>
              <td>
                {this.state.user !== null && (
                  <div
                    className="ProfileImage"
                    style={{
                      clear: "none",
                    }}
                  >
                    <img src={profileImage} alt={""} />
                  </div>
                )}
              </td>
              <td>
                <div className="WhoAmI">
                  {this.whoAmI()}
                  {this.state.user !== null && (
                    <div className="Logout" onClick={this.logout}>
                      {t("logout")}
                    </div>
                  )}
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    );
  }
}

export default withNamespaces("loggedInAs")(LoggedInAs);
