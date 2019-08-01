// Copyright (c) 2019 by Audere
//
// Use of this source code is governed by an MIT-style license that
// can be found in the LICENSE file distributed with this file.

import React from "react";

import { LoggedInAs } from "./LoggedInAs";
import logo from "./img/evdtracklogo.png";
import "./EbSiteHeader.css";

export interface EbSiteHeaderProps {}

export class EbSiteHeader extends React.Component<EbSiteHeaderProps> {
  render() {
    return (
      <div className="PatientListHeader">
        <div
          className="PatientListHeaderLogo"
          style={{
            clear: "none"
          }}
        >
          <img src={logo} />
        </div>
        <div
          style={{
            float: "right",
            clear: "none"
          }}
        >
          <LoggedInAs />
        </div>
      </div>
    );
  }
}
