// Copyright (c) 2019 by Audere
//
// Use of this source code is governed by an MIT-style license that
// can be found in the LICENSE file distributed with this file

import React from "react";
import { RouteComponentProps } from "react-router-dom";
import {
  EncounterDocument,
  EncounterTriageDocument
} from "audere-lib/dist/ebPhotoStoreProtocol";
import { SimpleMap } from "./SimpleMap";
import { loadAllEncounters, loadAllTriages } from "./util";

interface Props extends RouteComponentProps<{}> {}

interface State {
  encounters: EncounterDocument[];
  tDocs: EncounterTriageDocument[];
}

export class MapPage extends React.Component<Props, State> {
  state = {
    encounters: [],
    tDocs: []
  };

  async componentDidMount() {
    const [encounters, tDocs] = await Promise.all([
      loadAllEncounters(),
      loadAllTriages()
    ]);

    this.setState({ encounters, tDocs });
  }

  render() {
    return (
      <SimpleMap
        encounters={this.state.encounters}
        tDocs={this.state.tDocs}
        style={{ height: "100vh" }}
        zoom={6}
      />
    );
  }
}
