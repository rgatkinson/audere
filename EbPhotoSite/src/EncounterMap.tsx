// Copyright (c) 2019 by Audere
//
// Use of this source code is governed by an MIT-style license that
// can be found in the LICENSE file distributed with this file

import React from "react";
import {
  EncounterDocument,
  EncounterInfo,
  EncounterTriageDocument,
  PhotoInfo,
} from "audere-lib/dist/ebPhotoStoreProtocol";
import { SimpleMap, Location } from "./SimpleMap";

export enum MarkerStatus {
  EBOLA_POS,
  EBOLA_NEG,
  EBOLA_UNTRIAGED,
}

interface Props {
  encounters: EncounterDocument[];
  tDocs: EncounterTriageDocument[];
  style: React.CSSProperties;
  zoom: number;
}

export class EncounterMap extends React.Component<Props> {
  public render(): React.ReactNode {
    const locations = getLocations(this.props.encounters, this.props.tDocs);
    return (
      <SimpleMap
        locations={locations}
        style={this.props.style}
        zoom={this.props.zoom}
      />
    );
  }
}

function getDiagnosis(tDoc?: EncounterTriageDocument): MarkerStatus {
  if (tDoc === undefined || !tDoc.triage.diagnoses) {
    return MarkerStatus.EBOLA_UNTRIAGED;
  }
  const { diagnoses } = tDoc.triage;
  if (diagnoses.length > 0 && diagnoses[diagnoses.length - 1].value) {
    return MarkerStatus.EBOLA_POS;
  }
  return MarkerStatus.EBOLA_NEG;
}

function getLocations(
  encounters: EncounterDocument[],
  tDocs: EncounterTriageDocument[]
): Location[] {
  return encounters
    .filter(
      (eDoc: EncounterDocument) =>
        !!eDoc.encounter.rdtPhotos && eDoc.encounter.rdtPhotos.length > 0
    )
    .map((eDoc: EncounterDocument) => {
      const tDoc = tDocs.find(t => t.docId === eDoc.docId);
      const diagnosis = getDiagnosis(tDoc);
      return getLocation(eDoc, diagnosis, eDoc.encounter.rdtPhotos[0]);
    });
}

export function getLocation(
  eDoc: EncounterDocument,
  diagnosis: MarkerStatus,
  rdtPhoto: PhotoInfo
): Location {
  const enc: EncounterInfo = eDoc.encounter;
  return {
    name: enc.patient.lastName + ", " + enc.patient.firstName,
    date: rdtPhoto.timestamp.substring(0, 10),
    latitude: +rdtPhoto.gps.latitude,
    longitude: +rdtPhoto.gps.longitude,
    iconUrl: getIconUrl(diagnosis),
    docId: eDoc.docId,
  };
}

function getIconUrl(diagnosis: MarkerStatus): string {
  switch (diagnosis) {
    case MarkerStatus.EBOLA_POS:
      return "https://maps.google.com/mapfiles/ms/icons/red-dot.png";
    case MarkerStatus.EBOLA_NEG:
      // Would prefer gray but Google doesn't offer a gray dot
      return "https://maps.google.com/mapfiles/ms/icons/green-dot.png";
    case MarkerStatus.EBOLA_UNTRIAGED:
    default:
      return "https://maps.google.com/mapfiles/ms/icons/yellow-dot.png";
  }
}
