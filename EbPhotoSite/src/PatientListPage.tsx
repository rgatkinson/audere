// Copyright (c) 2019 by Audere
//
// Use of this source code is governed by an MIT-style license that
// can be found in the LICENSE file distributed with this file.

import React, { MouseEvent } from "react";
import { RouteComponentProps, withRouter } from "react-router-dom";
import "react-table/react-table.css";

import {
  EncounterDocument,
  EncounterTriageDocument,
} from "audere-lib/dist/ebPhotoStoreProtocol";
import { getApi } from "./api";
import "./PatientList.css";
import { PatientBlock } from "./PatientBlock";

export interface PatientsListPageProps extends RouteComponentProps<{}> {}

export interface PatientsListPageState {
  eDocs: EncounterDocument[] | null;
  tDocs: EncounterTriageDocument[];
  chatsUpdatedAt: { [eDocId: string]: string };
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
      chatsUpdatedAt: {},
      showTriagedMap: false,
      showUntriagedMap: false,
    };
  }

  private _unsubscribers: (() => void)[] = [];
  private _eDocHasMessageListener: { [edocId: string]: boolean } = {};

  componentDidMount() {
    this.setState({ chatsUpdatedAt: {} });
    this.load();
  }

  componentWillUnmount() {
    this._unsubscribers.forEach(unsubscribe => unsubscribe());
  }

  private async load(): Promise<void> {
    this._unsubscribers.push(
      getApi().listenForEncounters(eDocs => {
        this.setState({ eDocs });
        eDocs.forEach(eDoc => {
          if (this._eDocHasMessageListener[eDoc.docId]) {
            return;
          }
          this._eDocHasMessageListener[eDoc.docId] = true;
          this._unsubscribers.push(
            getApi().listenForLatestMessage(eDoc.docId, message => {
              this.setState(state => ({
                chatsUpdatedAt: {
                  ...state.chatsUpdatedAt,
                  [eDoc.docId]: message.timestamp,
                },
              }));
            })
          );
        });
      })
    );
    this._unsubscribers.push(
      getApi().listenForTriages(tDocs => this.setState({ tDocs }))
    );
  }

  private _select = (e: MouseEvent, eDoc: EncounterDocument) => {
    e.preventDefault();
    // TODO: guard against injection via docId here.
    this.props.history.push(`/patient-detail/${eDoc.docId}`);
  };

  private _splitTriagedFromUntriaged() {
    if (!this.state.eDocs) {
      return { triagedDocs: [], untriagedDocs: [] };
    }
    const triageWithDiagnoses = this.state.tDocs.filter(
      t => t.triage.diagnoses && t.triage.diagnoses.length > 0
    );
    const triagedDocIds = triageWithDiagnoses.map(t => t.docId);
    return {
      triagedDocs: this.state.eDocs.filter(d =>
        triagedDocIds.includes(d.docId)
      ),
      untriagedDocs: this.state.eDocs.filter(
        d => !triagedDocIds.includes(d.docId)
      ),
    };
  }

  private _renderPatients() {
    const { triagedDocs, untriagedDocs } = this._splitTriagedFromUntriaged();
    const { chatsUpdatedAt } = this.state;

    debug(
      `PatientList chat timestamps: ${JSON.stringify(chatsUpdatedAt, null, 2)}`
    );

    return (
      <div>
        <PatientBlock
          headerLabel={`Untriaged Patients (${untriagedDocs.length})`}
          eDocs={untriagedDocs}
          tDocs={this.state.tDocs}
          chatsUpdatedAt={chatsUpdatedAt}
          onSelectRow={this._select}
          showEvdResultColumns={false}
        />
        <PatientBlock
          headerLabel={`Triaged Patients (${triagedDocs.length})`}
          eDocs={triagedDocs}
          tDocs={this.state.tDocs}
          chatsUpdatedAt={chatsUpdatedAt}
          onSelectRow={this._select}
          showEvdResultColumns={true}
        />
      </div>
    );
  }

  public render(): React.ReactNode {
    const { eDocs: records } = this.state;
    return (
      <div className="PatientListBody">
        <div className="PatientListTitle">
          <h2>Patient Lists</h2>
        </div>
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

function debug(message: string) {
  if (false) {
    console.log(message);
  }
}
