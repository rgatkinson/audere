// Copyright (c) 2019 by Audere
//
// Use of this source code is governed by an MIT-style license that
// can be found in the LICENSE file distributed with this file.

import React, { ChangeEvent } from 'react';
import { RouteComponentProps, withRouter } from "react-router-dom";

import { PatientRecord, PatientRecordTriage } from "./protocol";
import { getApi } from "./api";

type InputChangeEvent = ChangeEvent<HTMLInputElement>;
type TextAreaChangeEvent = ChangeEvent<HTMLTextAreaElement>;

export interface PatientDetailMatchParams {
  uid: string;
}

export interface PatientDetailPageProps extends RouteComponentProps<PatientDetailMatchParams> {
}

export interface PatientDetailPageState {
  record: PatientRecord | null;
  triage: PatientRecordTriage | null;
}

class PatientDetailPageAssumeRouter extends React.Component<PatientDetailPageProps, PatientDetailPageState> {
  constructor(props: PatientDetailPageProps) {
    super(props);
    this.state = { record: null, triage: null };
  }

  componentDidMount() {
    this.load();
  }

  private load = async (): Promise<void> => {
    const { uid } = this.props.match.params;
    const api = getApi();
    const record = await api.loadRecord(uid);
    const triage = await api.loadTriage(uid);
    this.setState({ triage, record });
  }

  public render(): React.ReactNode {
    const { record, triage } = this.state;
    return record == null ? (
      <div>Loading...</div>
    ) : (
      <div>
        <PatientInfoPane record={record}/>
        <HealthWorkerPane record={record}/>
        <TriagePane record={record} triage={triage} reload={this.load}/>
        <PhotoPane record={record}/>
      </div>
    );
  }
}
export const PatientDetailPage = withRouter(PatientDetailPageAssumeRouter);

interface PatientDetailPaneProps {
  record: PatientRecord;
}

class HealthWorkerPane extends React.Component<PatientDetailPaneProps> {
  public render(): React.ReactNode {
    const { chw } = this.props.record;
    return (
      <div className="HealthWorkerPane">
        <h2>Health Worker</h2>
        <table>
          <tr><td>Name:</td><td>{chw.firstName} {chw.lastName}</td></tr>
          <tr><td>Phone:</td><td>{chw.phone}</td></tr>
          <tr><td>Notes:</td>{chw.notes}</tr>
        </table>
      </div>
    );
  }
}

class PatientInfoPane extends React.Component<PatientDetailPaneProps> {
  public render(): React.ReactNode {
    const { localId, patient } = this.props.record;
    return (
      <div className="PatientInfoPane">
        <h2>Patient</h2>
        <table>
          <tr><td>Local ID:</td><td>{localId}</td></tr>
          <tr><td>Name:</td><td>{patient.firstName} {patient.lastName}</td></tr>
          <tr><td>Phone:</td><td>{patient.phone}</td></tr>
          <tr><td>Notes:</td><td>{patient.notes}</td></tr>
        </table>
      </div>
    );
  }
}

interface TriageProps extends PatientDetailPaneProps {
  reload: () => Promise<void>
  record: PatientRecord,
  triage: PatientRecordTriage | null,
}

interface TriageState {
  busy: boolean;
  notes: string;
  testIndicatesEVD: boolean;
  error: string | null;
}

class TriagePane extends React.Component<TriageProps, TriageState> {
  constructor(props: TriageProps) {
    super(props);
    const { triage } = props;
    this.state = {
      busy: triage == null,
      error: null,
      notes: (triage && triage.notes) || "Loading...",
      testIndicatesEVD: (triage && triage.testIndicatesEVD) || false,
    };
  }

  onEVDChange = (e: InputChangeEvent) => this.setState({ testIndicatesEVD: e.target.checked })
  onNotesChange = (e: TextAreaChangeEvent) => this.setState({ notes: e.target.value });

  save = async() => {
    this.setState({ busy: true });
    const { uid } = this.props.record;
    const { notes, testIndicatesEVD } = this.state;
    const api = getApi();
    try {
      await api.saveTriage(uid, { uid, notes, testIndicatesEVD });
      this.setState({ busy: false });
    } catch (err) {
      this.setState({ busy: false, error: err.message });
    }

  }

  public render(): React.ReactNode {
    const { busy, notes, testIndicatesEVD, error } = this.state;
    return (
      <div className="TriagePane">
        <h2>Triage</h2>

        <div className="EditDetail">
          <label htmlFor="test-indicates-evd">Test Indicates EVD:</label>
          <input
            type="checkbox"
            name="NAME-test-indicates-evd"
            checked={testIndicatesEVD}
            disabled={busy}
            onChange={this.onEVDChange}
          />
        </div>

        <div className="EditDetail">
          <label htmlFor="notes">Notes:</label>
          <textarea
            id="notes"
            disabled={busy}
            value={notes}
            onChange={this.onNotesChange}
          />
        </div>

        {error != null &&
          <div className="Error">{error}</div>
        }

        <button
          type="button"
          disabled={busy}
          onClick={this.save}
        >Save</button>
      </div>
    );
  }
}

class PhotoPane extends React.Component<PatientDetailPaneProps> {
  public render(): React.ReactNode {
    const { photo } = this.props.record;
    // TODO: can we get a CDN url?
    return (
      <div className="PhotoPane">
        <h2>RDT Photo</h2>
        <table>
          <tr><td>Timestamp:</td><td>{photo.timestamp}</td></tr>
          <tr><td>Latitude:</td><td>{photo.gps.latitude}</td></tr>
          <tr><td>Longitude:</td>{photo.gps.longitude}</tr>
        </table>
      </div>
    );
  }
}
