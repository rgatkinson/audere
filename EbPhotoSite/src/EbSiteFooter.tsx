// Copyright (c) 2019 by Audere
//
// Use of this source code is governed by an MIT-style license that
// can be found in the LICENSE file distributed with this file.

import React from "react";
import "./EbSiteFooter.css";

export class EbSiteFooter extends React.Component {
  render() {
    return <div className={"Footer"}>©{new Date().getFullYear()} Audere</div>;
  }
}
