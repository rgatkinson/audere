// Copyright (c) 2019 by Audere
//
// Use of this source code is governed by an MIT-style license that
// can be found in the LICENSE file distributed with this file.

import React, { MouseEvent } from 'react';
import { Redirect } from "react-router-dom";

import { getApi, User } from "./api";

export interface LoggedInAsProps {
}

export interface LoggedInAsState {
  busy: boolean;
  user: User | null;
}

export class LoggedInAs extends React.Component<LoggedInAsProps, LoggedInAsState> {
  constructor(props: LoggedInAsProps) {
    super(props);
    this.state = {
      busy: false,
      user: getApi().currentUser()
    };
  }

  logout = async (e: MouseEvent) => {
    e.preventDefault();
    const api = getApi();
    const user = api.currentUser();
    if (user != null) {
      this.setState({ busy: true });
      await api.logout();
    }
    this.setState({ busy: false, user: api.currentUser() });
  }

  render() {
    const { busy, user } = this.state;
    return (
      <div className="WhoAmI">
        {user == null ? (
          <Redirect to="/" />
        ) : (
          <div>
            Logged in as '{user.email}'
            <button type="button" disabled={busy} onClick={this.logout}>Log out</button>
          </div>
        )}
      </div>
    )
  }
}
