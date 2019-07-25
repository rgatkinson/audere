// Copyright (c) 2019 by Audere
//
// Use of this source code is governed by an MIT-style license that
// can be found in the LICENSE file distributed with this file.

import React, { MouseEvent } from 'react';
import { Redirect, RouteComponentProps, withRouter } from "react-router-dom";
import ReactTable, { Column } from 'react-table';
import "react-table/react-table.css";

import { PatientRecord, PatientRecordTriage } from "./protocol";
import { getApi } from "./api";
import { LoggedInAs } from "./LoggedInAs";

export interface PatientsListPageProps extends RouteComponentProps<{}> {
}

export interface PatientsListPageState {
  records: PatientRecord[] | null;
}

class PatientListPageAssumeRouter extends React.Component<PatientsListPageProps, PatientsListPageState> {
  constructor(props: PatientsListPageProps) {
    super(props);
    this.state = { records: null };
  }

  componentDidMount() {
    this.load();
  }

  private async load(): Promise<void> {
    const records = await getApi().loadPatientRecord();
    this.setState({ records });
  }

  private select = (e: MouseEvent, record: PatientRecord) => {
    e.preventDefault();
    this.props.history.push(`/patient-detail/${record.uid}`);
  }

  public render(): React.ReactNode {
    const { records } = this.state;
    return (
      <div>
        <LoggedInAs />
        {records == null ? (
          "Loading..."
        ) : (
          <PatientTable records={records} onSelect={this.select} />
        )}
      </div>
    );
  }
}

export const PatientListPage = withRouter(PatientListPageAssumeRouter);

interface PatientTableRow {
  record: PatientRecord;
  triage: PatientRecordTriage | null;
}

interface PatientTableProps {
  records: PatientRecord[];
  onSelect: (e: MouseEvent, record: PatientRecord) => void
}

interface PatientTableState {
  rows: PatientTableRow[];
  selected: PatientRecord | null;
}

class PatientTable extends React.Component<PatientTableProps, PatientTableState> {
  constructor(props: PatientTableProps) {
    super(props);
    this.state = {
      selected: null,
      rows: this.props.records.map(record => ({ record, triage: null })),
    };
  }

  componentDidMount() {
    this.load();
  }

  private async load(): Promise<void> {
    const api = getApi();
    // TODO: parallel
    // TODO: only visible
    const triages = new Map<string, PatientRecordTriage>();
    for (let row of this.state.rows) {
      try {
        const triage = await api.loadTriage(row.record.uid);
        triages.set(triage.uid, triage);

        // this.state.rows can change during the await, and each iteration.

        this.setState({
          rows: this.props.records.map(record => ({
            record,
            triage: triages.get(record.uid) || null
          }))
        })
      } catch (err) {
        // TODO, skipping for now
      }
    }
  }

  private getTrProps = (state: any, row: any, column: any, instance: any) => {
    return {
      onClick: (e: MouseEvent, handleOriginal: () => void) => {
        this.props.onSelect(e, row.original.record);
      }
    };
  }

  columns(): Column<PatientTableRow>[] {
    return [
      {
        Header: "Timestamp",
        accessor: "record.photo.timestamp",
        minWidth: 150,
      },
      {
        Header: "CHW",
        accessor: "record.chw.lastName",
        minWidth: 120,
      },
      {
        Header: "CHW Phone",
        accessor: "record.chw.phone",
        minWidth: 80,
      },
      {
        Header: "ID",
        accessor: "record.localId",
        minWidth: 40,
      },
      {
        Header: "Patient",
        accessor: "record.patient.lastName",
        minWidth: 120,
      },
      {
        Header: "Triage",
        accessor: row => row.triage == null ? "Loading.." : firstLine(row.triage.notes),
        id: "triage",
        minWidth: 200,
      },
      {
        Header: "EVD",
        accessor: r => r.triage == null ? ".." : (r.triage.testIndicatesEVD ? "yes" : "no"),
        id: "evd",
        minWidth: 40,
      },
    ];
  }

  public render(): React.ReactNode {
    const { selected } = this.state;
    return selected != null ? (
      <Redirect to={`/patient-detail/${selected.uid}`}/>
    ) : (
      <ReactTable
        data={this.state.rows}
        columns={this.columns()}
        show-pagination={false}
        default-page-size={100}
        getTrProps={this.getTrProps}
      />
    );
  }
}

function firstLine(s: string | null): string {
  if (s == null || typeof s !== "string") {
    return "";
  }
  const index = s.indexOf("\n");
  return index < 0 ? s : s.substring(0, index);
}
