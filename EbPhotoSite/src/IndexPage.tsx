// Copyright (c) 2019 by Audere
//
// Use of this source code is governed by an MIT-style license that
// can be found in the LICENSE file distributed with this file.

import React, { ChangeEventHandler, MouseEvent } from 'react';
import { Redirect } from "react-router-dom";
import "react-table/react-table.css";

import { getApi, User } from "./api";

type InputChangeHandler = ChangeEventHandler<HTMLInputElement>;

export interface IndexPageProps {
}

export interface IndexPageState {
  user: User | null;
}

export class IndexPage extends React.Component<IndexPageProps, IndexPageState> {
  constructor(props: IndexPageProps) {
    super(props);
    this.state = { user: getApi().currentUser() };
  }

  public render(): React.ReactNode {
    const { user } = this.state;
    return user != null ? (
      <Redirect to="/patients" />
    ) : (
      <LoginForm onUserChange={u => this.setState({ user: u })} />
    );
  }
}

export interface LoginProps {
  onUserChange: (user: User) => void
}

export interface LoginState {
  busy: boolean;
  email: string;
  password: string;
  error: string | null;
  user: User | null;
}

export class LoginForm extends React.Component<LoginProps, LoginState> {
  constructor(props: LoginProps) {
    super(props);
    this.state = {
      email: "",
      password: "",
      busy: false,
      error: null,
      user: null,
    };
  }

  private login = async (e: MouseEvent) => {
    const api = getApi();
    e.preventDefault();
    this.setState({ busy: true });
    try {
      const { email, password } = this.state;
      const user = await api.login(email, password);
      this.setState({ busy: false, user });
    } catch (err) {
      this.setState({ busy: false, error: err.message });
    }
  }

  private validate() {
    const { email, password } = this.state;
    return email.length > 0 && password.length > 0 && !this.state.busy;
  }

  private setEmail: InputChangeHandler = e => this.setState({
    email: e.target.value,
    error: null
  });

  private setPass: InputChangeHandler = e => this.setState({
    password: e.target.value,
    error: null
  });

  public render(): React.ReactNode {
    const { busy, email, password, error, user } = this.state;
    return user ? (
      <Redirect to="/patients"/>
    ) : (
      <div className="IndexPage">
        <h2>Please login.</h2>

        <div className="EditDetail">
          <label htmlFor="email">Email:</label>
          <input
            id="email"
            type="text"
            disabled={busy}
            value={email}
            onChange={this.setEmail}
          />
        </div>

        <div className="EditDetail">
          <label htmlFor="password">Password:</label>
          <input
            id="password"
            type="password"
            disabled={busy}
            value={password}
            onChange={this.setPass}
          />
        </div>

        {error != null &&
          <div className="Error">{error}</div>
        }

        <button
          type="button"
          disabled={!this.validate()}
          onClick={this.login}
        >Login</button>
      </div>
    );
  }
}
