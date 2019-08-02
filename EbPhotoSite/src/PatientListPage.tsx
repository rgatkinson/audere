// Copyright (c) 2019 by Audere
//
// Use of this source code is governed by an MIT-style license that
// can be found in the LICENSE file distributed with this file.

import React, { MouseEvent } from "react";
import { RouteComponentProps, withRouter } from "react-router-dom";
import "react-table/react-table.css";

import {
  EncounterDocument,
  EncounterTriageDocument
} from "audere-lib/dist/ebPhotoStoreProtocol";
import { loadAllEncounters, loadAllTriages } from "./util";
import "./PatientList.css";
import { PatientBlock } from "./PatientBlock";

export interface PatientsListPageProps extends RouteComponentProps<{}> {}

export interface PatientsListPageState {
  eDocs: EncounterDocument[] | null;
  tDocs: EncounterTriageDocument[];
  showTriagedMap: boolean;
  showUntriagedMap: boolean;
}

class PatientListPageAssumeRouter extends React.Component<
  PatientsListPageProps,
  PatientsListPageState
> {
  constructor(props: PatientsListPageProps) {
    super(props);
    this.state = {
      eDocs: null,
      tDocs: [],
      showTriagedMap: false,
      showUntriagedMap: false
    };
  }

  componentDidMount() {
    this.load();
  }

  private async load(): Promise<void> {
    const [encounters, triages] = await Promise.all([
      loadAllEncounters(),
      loadAllTriages()
    ]);

    this.setState({
      eDocs: encounters,
      tDocs: triages
    });
  }

  private _select = (e: MouseEvent, eDoc: EncounterDocument) => {
    e.preventDefault();
    // TODO: guard against injection via docId here.
    this.props.history.push(`/patient-detail/${eDoc.docId}`);
  };

  private _splitTriagedFromUntriaged() {
    const triageWithDiagnoses = this.state.tDocs.filter(
      t => t.triage.diagnoses && t.triage.diagnoses.length > 0
    );
    const triagedDocIds = triageWithDiagnoses.map(t => t.docId);
    return {
      triagedDocs: this.state.eDocs!.filter(d =>
        triagedDocIds.includes(d.docId)
      ),
      untriagedDocs: this.state.eDocs!.filter(
        d => !triagedDocIds.includes(d.docId)
      )
    };
  }

  private _renderPatients() {
    const { triagedDocs, untriagedDocs } = this._splitTriagedFromUntriaged();

    return (
      <div>
        <PatientBlock
          headerLabel={"Untriaged Patients"}
          eDocs={untriagedDocs}
          tDocs={[]}
          onSelectRow={this._select}
        />
        <PatientBlock
          headerLabel={"Triaged Patients"}
          eDocs={triagedDocs}
          tDocs={this.state.tDocs}
          onSelectRow={this._select}
        />
      </div>
    );
  }

  public render(): React.ReactNode {
    const { eDocs: records } = this.state;
    return (
      <div className="PatientListBody">
        <div className="PatientListLegendHeader">Patient Lists</div>
        <div className="PatientListLegend">
          Click on a row to see details for a specific patient and to contact
          the CHW who tested the patient.
        </div>
        {records == null ? "Loading..." : this._renderPatients()}
      </div>
    );
  }
}

export const PatientListPage = withRouter(PatientListPageAssumeRouter);
