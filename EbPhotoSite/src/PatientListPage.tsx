// Copyright (c) 2019 by Audere
//
// Use of this source code is governed by an MIT-style license that
// can be found in the LICENSE file distributed with this file.

import React, { MouseEvent } from "react";
import { Redirect, RouteComponentProps, withRouter } from "react-router-dom";
import ReactTable, { Column } from "react-table";
import "react-table/react-table.css";

import {
  EncounterDocument,
  EncounterTriageDocument
} from "audere-lib/dist/ebPhotoStoreProtocol";
import { getApi } from "./api";
import { localeDate, last } from "./util";
import "./PatientList.css";
import mapIcon from "./img/mapview.png";
import listIcon from "./img/listview.png";

export interface PatientsListPageProps extends RouteComponentProps<{}> {}

export interface PatientsListPageState {
  eDocs: EncounterDocument[] | null;
}

class PatientListPageAssumeRouter extends React.Component<
  PatientsListPageProps,
  PatientsListPageState
> {
  constructor(props: PatientsListPageProps) {
    super(props);
    this.state = { eDocs: null };
  }

  componentDidMount() {
    this.load();
  }

  private async load(): Promise<void> {
    const encounters = await getApi().loadEncounters();
    this.setState({
      eDocs: encounters.docs.map((x: any) => x.data() as EncounterDocument)
    });
  }

  private select = (e: MouseEvent, eDoc: EncounterDocument) => {
    e.preventDefault();
    // TODO: guard against injection via docId here.
    this.props.history.push(`/patient-detail/${eDoc.docId}`);
  };

  public render(): React.ReactNode {
    const { eDocs: records } = this.state;
    return (
      <div className="PatientListBody">
        <div className="PatientListLegendHeader">Patient Lists</div>
        <div className="PatientListLegend">
          Click on a row to see details for a specific patient and to contact
          the CHW who tested the patient.
        </div>
        {records == null ? (
          "Loading..."
        ) : (
          <div>
            <table className="PatientTableTitle">
              <tr>
                <td>Un-triaged Patients () </td>
                <td className="ListViewIcon">
                  <img src={listIcon} />
                </td>
                <td className="ListViewText">List View</td>

                <td className="MapViewIcon">
                  <img src={mapIcon} />
                </td>
                <td className="MapViewText">Map View</td>
              </tr>
            </table>
            <PatientTable eDocs={records} onSelect={this.select} />
          </div>
        )}
      </div>
    );
  }
}

export const PatientListPage = withRouter(PatientListPageAssumeRouter);

interface PatientTableRow {
  eDoc: EncounterDocument;
  tDoc: EncounterTriageDocument | null;
}

interface PatientTableProps {
  eDocs: EncounterDocument[];
  onSelect: (e: MouseEvent, record: EncounterDocument) => void;
}

interface PatientTableState {
  rows: PatientTableRow[];
  selected: EncounterDocument | null;
}

class PatientTable extends React.Component<
  PatientTableProps,
  PatientTableState
> {
  constructor(props: PatientTableProps) {
    super(props);
    this.state = {
      selected: null,
      rows: this.props.eDocs.map(eDoc => ({ eDoc, tDoc: null }))
    };
  }

  componentDidMount() {
    this.load();
  }

  private async load(): Promise<void> {
    const api = getApi();
    // TODO: only visible

    const rows = await Promise.all(
      this.props.eDocs.map(async eDoc => {
        try {
          const triage = await api.loadTriage(eDoc.docId);
          return {
            eDoc,
            tDoc: (triage.data() as EncounterTriageDocument) || {
              triage: {
                notes: "",
                diagnoses: []
              }
            }
          };
        } catch (err) {
          console.log(`PatientListPage error loading triage '${eDoc.docId}'`);
          return { eDoc, tDoc: null };
        }
      })
    );
    this.setState({ rows });
  }

  private triageIsPositive(tDoc: EncounterTriageDocument): boolean {
    const diagnoses = tDoc && tDoc.triage.diagnoses;
    return (
      !!diagnoses &&
      diagnoses.length > 0 &&
      diagnoses[diagnoses.length - 1].value
    );
  }

  private getTrProps = (state: any, row: any, column: any, instance: any) => {
    const evd = row && this.triageIsPositive(row.original.tDoc);
    return {
      onClick: (e: MouseEvent, handleOriginal: () => void) => {
        this.props.onSelect(e, row.original.eDoc);
      },
      style: {
        background: evd ? "#FFC0CB" : "white"
      }
    };
  };

  private getTimestamp(row: PatientTableRow) {
    const photo = last(row.eDoc.encounter.rdtPhotos);
    if (!photo) {
      return null;
    }
    return photo.timestamp;
  }

  columns(): Column<PatientTableRow>[] {
    return [
      {
        Header: "Date Tested",
        accessor: row => {
          return this.getTimestamp(row);
        },
        Cell: cellInfo => {
          const timestamp = this.getTimestamp(cellInfo.original);
          return timestamp ? localeDate(timestamp) : "Not Tested";
        },
        id: "timestamp",
        minWidth: 110
      },
      {
        Header: "Patient Name",
        accessor: row => {
          const p = row.eDoc.encounter.patient;
          return `${p.firstName} ${p.lastName}`;
        },
        id: "patient.name",
        minWidth: 110
      },
      {
        Header: "Triaged",
        accessor: r =>
          r.tDoc == null
            ? ".."
            : r.tDoc.triage.diagnoses && r.tDoc.triage.diagnoses.length > 0
            ? "yes"
            : "no",
        id: "triaged",
        minWidth: 90
      },
      {
        Header: "EVD Test Result",
        accessor: r =>
          r.tDoc == null ? ".." : this.triageIsPositive(r.tDoc) ? "yes" : "no",
        id: "evd",
        minWidth: 70
      },
      {
        Header: "EVD Result Notes",
        accessor: row =>
          row.tDoc == null ? "Loading.." : firstLine(row.tDoc.triage.notes),
        id: "triage",
        minWidth: 200
      },
      {
        Header: "CHW Name",
        accessor: row => {
          const w = row.eDoc.encounter.healthWorker;
          return `${w.firstName} ${w.lastName}`;
        },
        id: "healthWorker.name",
        minWidth: 110
      },
      {
        Header: "CHW Phone #",
        accessor: "eDoc.encounter.healthWorker.phone",
        minWidth: 80
      }
    ];
  }

  public render(): React.ReactNode {
    const { selected } = this.state;
    return selected != null ? (
      <Redirect to={`/patient-detail/${selected.docId}`} />
    ) : (
      <ReactTable
        data={this.state.rows}
        columns={this.columns()}
        show-pagination={false}
        default-page-size={100}
        getTrProps={this.getTrProps}
        defaultSorted={[
          {
            id: "timestamp",
            desc: true
          }
        ]}
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
