// Copyright (c) 2019 by Audere
//
// Use of this source code is governed by an MIT-style license that
// can be found in the LICENSE file distributed with this file.

import React from "react";
import * as buildInfo from "./static/buildInfo.json";

export class BuildInfoPage extends React.Component {
  render() {
    return (
      <div>
        <p>Name: {buildInfo.name}</p>
        <p>Version: {buildInfo.version}</p>
        <p>Build date: {buildInfo.buildDate}</p>
        <p>Hash: {buildInfo.hash}</p>
      </div>
    );
  }
}