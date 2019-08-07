// Copyright (c) 2019 by Audere
//
// Use of this source code is governed by an MIT-style license that
// can be found in the LICENSE file distributed with this file.

import React, { MouseEvent } from "react";
import { Redirect } from "react-router-dom";
import ReactTable, { Column, ReactTableFunction, RowInfo } from "react-table";
import "react-table/react-table.css";

import {
  EncounterDocument,
  EncounterTriageDocument,
  Message,
} from "audere-lib/dist/ebPhotoStoreProtocol";
import { localeDate, last } from "./util";
import "./PatientTable.css";

interface PatientTableRow {
  eDoc: EncounterDocument;
  tDoc: EncounterTriageDocument | undefined;
  latestMessage: Message | undefined;
}

interface PatientTableProps {
  eDocs: EncounterDocument[];
  tDocs: EncounterTriageDocument[];
  latestMessages: { [eDocId: string]: Message };
  onSelect: (e: MouseEvent, record: EncounterDocument) => void;
}

interface PatientTableState {
  selected: EncounterDocument | null;
}

export class PatientTable extends React.Component<
  PatientTableProps,
  PatientTableState
> {
  constructor(props: PatientTableProps) {
    super(props);
    this.state = {
      selected: null,
    };
  }

  private getRows() {
    return this.props.eDocs.map(eDoc => ({
      eDoc,
      tDoc: this.props.tDocs.find(t => t.docId === eDoc.docId),
      latestMessage: this.props.latestMessages[eDoc.docId],
    }));
  }

  private triageIsPositive(tDoc: EncounterTriageDocument | undefined): boolean {
    if (!tDoc) {
      return false;
    }
    const diagnoses = tDoc && tDoc.triage.diagnoses;
    return (
      !!diagnoses &&
      diagnoses.length > 0 &&
      diagnoses[diagnoses.length - 1].value
    );
  }

  private getTrProps = (state: any, row: any, column: any, instance: any) => {
    const newMessage =
      row &&
      row.original.latestMessage &&
      (!row.original.tDoc ||
        row.original.latestMessage.timestamp >
          row.original.tDoc.triage.lastViewed);
    const newData =
      row &&
      (!row.original.tDoc ||
        row.original.eDoc.updatedAt > row.original.tDoc.triage.lastViewed);
    return {
      onClick: (e: MouseEvent, handleOriginal: () => void) => {
        this.props.onSelect(e, row.original.eDoc);
      },
      style: {
        fontWeight: newMessage || newData ? "bold" : "normal",
      },
    };
  };

  private getTimestamp(row: PatientTableRow) {
    const photo = last(row.eDoc.encounter.rdtPhotos);
    if (!photo) {
      return null;
    }
    return photo.timestamp;
  }

  private redIfPositive = (state: any, rowInfo: RowInfo) =>
    rowInfo && this.triageIsPositive(rowInfo.original.tDoc)
      ? {
          style: {
            color: "#c00",
          },
        }
      : {};

  columns(): Column<PatientTableRow>[] {
    const evdResultColumns: Column<PatientTableRow>[] = [
      {
        Header: "EVD Test Result",
        accessor: r =>
          r.tDoc == null
            ? ".."
            : this.triageIsPositive(r.tDoc)
            ? "POSITIVE"
            : "NEGATIVE",
        id: "evd",
        minWidth: 90,
        getProps: (this.redIfPositive as unknown) as ReactTableFunction,
      },
      {
        Header: "EVD Result Notes",
        accessor: row =>
          row.tDoc == null ? "Loading.." : firstLine(row.tDoc.triage.notes),
        id: "triage",
        minWidth: 200,
      },
    ];
    let mainColumns: Column<PatientTableRow>[] = [
      {
        Header: "Date Tested",
        accessor: row => {
          return this.getTimestamp(row);
        },
        Cell: cellInfo => {
          const timestamp = cellInfo && this.getTimestamp(cellInfo.original);
          return timestamp ? localeDate(timestamp) : "Not Tested";
        },
        id: "timestamp",
        minWidth: 110,
        getProps: (this.redIfPositive as unknown) as ReactTableFunction,
      },
      {
        Header: "Patient Name",
        accessor: row => {
          const p = row.eDoc.encounter.patient;
          return `${p.firstName} ${p.lastName}`;
        },
        id: "patient.name",
        minWidth: 110,
        getProps: (this.redIfPositive as unknown) as ReactTableFunction,
      },
      {
        Header: "CHW Name",
        accessor: row => {
          const w = row.eDoc.encounter.healthWorker;
          return `${w.firstName} ${w.lastName}`;
        },
        id: "healthWorker.name",
        minWidth: 110,
      },
      {
        Header: "CHW Phone #",
        accessor: "eDoc.encounter.healthWorker.phone",
        minWidth: 80,
      },
    ];

    if (this.props.tDocs.length > 0) {
      mainColumns.splice(2, 0, ...evdResultColumns);
    }
    return mainColumns;
  }

  public render(): React.ReactNode {
    const { selected } = this.state;
    return selected != null ? (
      <Redirect to={`/patient-detail/${selected.docId}`} />
    ) : (
      <ReactTable
        data={this.getRows()}
        columns={this.columns()}
        show-pagination={false}
        default-page-size={100}
        defaultPageSize={10}
        getTrProps={this.getTrProps}
        defaultSorted={[
          {
            id: "timestamp",
            desc: true,
          },
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
