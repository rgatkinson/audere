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
} from "audere-lib/dist/ebPhotoStoreProtocol";
import { localeDate, last } from "./util";
import "./PatientTable.css";
import { WithNamespaces, withNamespaces } from "react-i18next";

interface PatientTableRow {
  eDoc: EncounterDocument;
  tDoc: EncounterTriageDocument | undefined;
  chatUpdatedAt: string;
}

interface PatientTableProps {
  eDocs: EncounterDocument[];
  tDocs: EncounterTriageDocument[];
  chatsUpdatedAt: { [eDocId: string]: string };
  onSelect: (e: MouseEvent, record: EncounterDocument) => void;
  showEvdResultColumns: boolean;
}

interface PatientTableState {
  selected: EncounterDocument | null;
}

export class PatientTable extends React.Component<
  PatientTableProps & WithNamespaces,
  PatientTableState
> {
  constructor(props: PatientTableProps & WithNamespaces) {
    super(props);
    this.state = {
      selected: null,
    };
  }

  private getRows(): PatientTableRow[] {
    return this.props.eDocs.map(eDoc => ({
      eDoc,
      tDoc: this.props.tDocs.find(t => t.docId === eDoc.docId),
      chatUpdatedAt: this.props.chatsUpdatedAt[eDoc.docId] || "",
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
    if (row == null) {
      return {};
    }

    const { eDoc, tDoc, chatUpdatedAt } = row.original as PatientTableRow;
    const triage = tDoc && tDoc.triage;

    const chatSeenAt = (triage && triage.seenMessageTimestamp) || "";
    const dataSeenAt = (triage && triage.seenEncounterTimestamp) || "";
    const dataUpdatedAt = eDoc.encounter.updatedAt;
    const hasNewMessage = chatUpdatedAt > chatSeenAt;
    const hasNewData = dataUpdatedAt > dataSeenAt;

    if (row) {
      debug(`row: ${row.original.eDoc.docId}`);
      if (hasNewMessage) {
        debug(`  hasNewMessage=${hasNewMessage}`);
        debug(`    ${chatUpdatedAt} chatUpdatedAt`);
        debug(`    ${chatSeenAt} chatSeenAt`);
      }
      if (hasNewData) {
        debug(`  hasNewData=${hasNewData}`);
        debug(`    ${dataUpdatedAt} dataUpdatedAt`);
        debug(`    ${dataSeenAt} dataSeenAt`);
      }
    }
    return {
      onClick: (e: MouseEvent, handleOriginal: () => void) => {
        this.props.onSelect(e, eDoc);
      },
      style: {
        fontWeight: hasNewMessage || hasNewData ? "bold" : "normal",
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
    const { t } = this.props;
    const evdResultColumns: Column<PatientTableRow>[] = [
      {
        Header: t("EbolaTestResult"),
        accessor: r =>
          r.tDoc == null
            ? ".."
            : this.triageIsPositive(r.tDoc)
            ? t("common:POSITIVE")
            : t("common:NEGATIVE"),
        id: "evd",
        minWidth: 90,
        getProps: (this.redIfPositive as unknown) as ReactTableFunction,
      },
      {
        Header: t("EbolaResultNotes"),
        accessor: row =>
          row.tDoc == null
            ? t("common:loading")
            : firstLine(row.tDoc.triage.notes),
        id: "triage",
        minWidth: 200,
      },
    ];
    let mainColumns: Column<PatientTableRow>[] = [
      {
        Header: t("dateTested"),
        accessor: row => {
          return this.getTimestamp(row);
        },
        Cell: cellInfo => {
          const timestamp = cellInfo && this.getTimestamp(cellInfo.original);
          return timestamp ? localeDate(timestamp) : t("notTested");
        },
        id: "timestamp",
        minWidth: 110,
        getProps: (this.redIfPositive as unknown) as ReactTableFunction,
      },
      {
        Header: t("patientName"),
        accessor: row => {
          const p = row.eDoc.encounter.patient;
          return `${p.firstName} ${p.lastName}`;
        },
        id: "patient.name",
        minWidth: 110,
        getProps: (this.redIfPositive as unknown) as ReactTableFunction,
      },
      {
        Header: t("CHWName"),
        accessor: row => {
          const w = row.eDoc.encounter.healthWorker;
          return `${w.firstName} ${w.lastName}`;
        },
        id: "healthWorker.name",
        minWidth: 110,
      },
      {
        Header: t("CHWPhone"),
        accessor: "eDoc.encounter.healthWorker.phone",
        minWidth: 80,
      },
    ];

    if (this.props.showEvdResultColumns) {
      mainColumns.splice(2, 0, ...evdResultColumns);
    }
    return mainColumns;
  }

  public render(): React.ReactNode {
    const { selected } = this.state;
    const { t } = this.props;
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
        previousText={t("common:previous")}
        nextText={t("common:next")}
        loadingText={t("common:loading")}
        noDataText={t("noRows")}
        pageText={t("page")}
        ofText={t("outOf")}
        rowsText={t("rows")}
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

function debug(message: string) {
  if (false) {
    debug(message);
  }
}

export default withNamespaces("patientTable")(PatientTable);
