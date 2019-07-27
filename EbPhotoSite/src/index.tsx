// Copyright (c) 2019 by Audere
//
// Use of this source code is governed by an MIT-style license that
// can be found in the LICENSE file distributed with this file.

import React from 'react';
import ReactDOM from 'react-dom';
import { BrowserRouter as Router, Route, Switch } from "react-router-dom";

import * as serviceWorker from './serviceWorker';
import { getRoot } from "./util";
import { IndexPage } from "./IndexPage";
import { PatientListPage } from "./PatientListPage";
import { PatientDetailPage } from "./PatientDetailPage";

class FourOhFour extends React.Component {
  public render(): React.ReactNode {
    return <div>404 Not Found, no route for this location</div>;
  }
}

ReactDOM.render(
  (
    <Router>
       <Switch>
        <Route exact path="/" component={IndexPage} />
        <Route path="/patients" component={PatientListPage} />
        <Route path="/patient-detail/:docId" component={PatientDetailPage} />
        <Route component={FourOhFour} />
      </Switch>
    </Router>
  ),
  getRoot()
);

// ReactDOM.render(<App csrf={csrf}/>, root);

// If you want your app to work offline and load faster, you can change
// unregister() to register() below. Note this comes with some pitfalls.
// Learn more about service workers: https://bit.ly/CRA-PWA
serviceWorker.unregister();
