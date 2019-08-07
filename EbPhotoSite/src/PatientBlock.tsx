// Copyright (c) 2019 by Audere
//
// Use of this source code is governed by an MIT-style license that
// can be found in the LICENSE file distributed with this file.

import React, { MouseEvent } from "react";

import {
  EncounterDocument,
  EncounterTriageDocument,
  Message,
} from "audere-lib/dist/ebPhotoStoreProtocol";
import "./PatientList.css";
import mapIcon from "./img/mapview.png";
import listIcon from "./img/listview.png";
import { PatientTable } from "./PatientTable";
import { SimpleMap } from "./SimpleMap";

interface Props {
  headerLabel: string;
  eDocs: EncounterDocument[];
  tDocs: EncounterTriageDocument[];
  latestMessages: { [eDocId: string]: Message };
  onSelectRow: (e: MouseEvent, eDoc: EncounterDocument) => void;
  showEvdResultColumns: boolean;
}

interface State {
  showMap: boolean;
}

export class PatientBlock extends React.Component<Props, State> {
  state: State = {
    showMap: false,
  };

  _onShowList = () => {
    this.setState({ showMap: false });
  };

  _onShowMap = () => {
    this.setState({ showMap: true });
  };

  _renderListHeader() {
    return (
      <table className="PatientTableTitle">
        <tr>
          <td>{this.props.headerLabel}</td>
          <td className="ListViewIcon">
            <div className="viewButton" onClick={this._onShowList}>
              <img src={listIcon} alt="listIcon" onClick={this._onShowList} />
              <div className="ListViewText">List View</div>
            </div>
          </td>

          <td className="MapViewIcon">
            <div className="viewButton" onClick={this._onShowMap}>
              <img src={mapIcon} alt="mapIcon" onClick={this._onShowMap} />
              <div className="MapViewText">Map View</div>
            </div>
          </td>
        </tr>
      </table>
    );
  }

  render() {
    const mainView = this.state.showMap ? (
      <SimpleMap
        encounters={this.props.eDocs}
        tDocs={this.props.tDocs}
        style={{ height: "25rem" }}
        zoom={6}
      />
    ) : (
      <PatientTable
        eDocs={this.props.eDocs}
        tDocs={this.props.tDocs}
        latestMessages={this.props.latestMessages}
        onSelect={this.props.onSelectRow}
        showEvdResultColumns={this.props.showEvdResultColumns}
      />
    );
    return (
      <div>
        {this._renderListHeader()}
        {mainView}
      </div>
    );
  }
}
