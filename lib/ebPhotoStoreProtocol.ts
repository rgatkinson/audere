// Copyright (c) 2019 by Audere
//
// Use of this source code is governed by an MIT-style license that
// can be found in the LICENSE file distributed with this file.

// ========================================================================
//
// PLEASE NOTE:
//
// If you need to change types here sometime after we store real data:
// Because these types are used across client/server, we have to maintain
// compatibility.  The two ways of doing this are:
//   1) Add a new optional field.
//   2) Bump the top-level schemaId, and create a new version of each
//      container type from the modified type up to the root of the
//      containment tree.
//
// ========================================================================

import { ClientVersionInfo } from "./common";

export { ClientVersionInfo };

export interface ProtocolDocumentBase {
  documentType: string;
  schemaId: number;

  // unique id for this document.
  docId: string;

  // information about client device, if created on client.
  // not present for web-created documents.
  device?: DeviceInfo;
}

export interface DeviceInfo {
  installation: string;
  clientVersion: ClientVersionInfo;
  clientBuild: number;
  yearClass: string;
  idiomText: string;
  platform: object;
}

export enum DocumentType {
  Encounter = "ENCOUNTER",
  Triage = "TRIAGE",
}

export type ProtocolDocument = EncounterDocument | EncounterTriageDocument;

export type TransportMetadata = {
  sentAt: string;
  receivedAt?: string;
  lastWriter: "sender" | "receiver";
  protocolVersion: number;
};

export type FirestoreProtocolDocument = ProtocolDocument & {
  _transport: TransportMetadata;
};

// ================================================================================
// Encounter

export interface EncounterDocument extends ProtocolDocumentBase {
  documentType: DocumentType.Encounter;
  schemaId: 1;
  encounter: EncounterInfo;
}

export interface EncounterInfo {
  isDemo: boolean;
  healthWorker: HealthWorkerInfo;
  localIndex: string;
  patient: PatientInfo;
  photoDocId: string;
  details?: string;
  rdtPhotos: PhotoInfo[];
}

export interface HealthWorkerInfo {
  firstName: string;
  lastName: string;
  phone: string;
  notes: string;
}

export interface PatientInfo {
  firstName: string;
  lastName: string;
  phone: string;
  notes: string;
}

export interface PhotoInfo {
  timestamp: string;
  gps: GPSInfo;
  photoId: string;
}

export interface GPSInfo {
  latitude: string;
  longitude: string;
}

export interface PhotoDbInfo extends PhotoInfo {
  jpegBase64: string;
}

// ================================================================================
// Triage

// The docId for this document matches docId for corresponding EncounterDocument.
// These are separate documents because EncounterDocument is written by the client
// and TriageDocument is written by the website.

export interface EncounterTriageDocument extends ProtocolDocumentBase {
  documentType: DocumentType.Triage;
  schemaId: 1;
  triage: EncounterTriageInfo;
}

export interface EncounterTriageInfo {
  notes: string;
  testIndicatesEVD: boolean;
}
