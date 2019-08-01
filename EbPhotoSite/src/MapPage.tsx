// Copyright (c) 2019 by Audere
//
// Use of this source code is governed by an MIT-style license that
// can be found in the LICENSE file distributed with this file

import React from "react";
import { RouteComponentProps } from "react-router-dom";
import { EncounterDocument } from "audere-lib/dist/ebPhotoStoreProtocol";
import { SimpleMap } from "./SimpleMap";
import { loadAllEncounters } from "./util";

interface Props extends RouteComponentProps<{}> {}

interface State {
  encounters: EncounterDocument[];
}

export class MapPage extends React.Component<Props, State> {
  state = {
    encounters: []
  };

  async componentDidMount() {
    const encounters = await loadAllEncounters();

    this.setState({ encounters });
  }

  render() {
    return (
      <SimpleMap
        encounters={this.state.encounters}
        style={{ height: "100vh" }}
      />
    );
  }
}
