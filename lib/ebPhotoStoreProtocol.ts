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

import * as common from "./common";

import { ClientVersionInfo, SampleInfo } from "./common";

export { ClientVersionInfo, SampleInfo };

export interface ProtocolDocumentBase {
  documentType: string;
  schemaId: number;

  // unique id for this document.
  docId: string;

  // information about client device
  device: DeviceInfo;
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
  Patient = "PATIENT",
  Photo = "PHOTO"
}

export type ProtocolDocument = PatientDocument | PhotoDocument;

export type TransportMetadata = {
  sentAt: string;
  receivedAt?: string;
  lastWriter: "sender" | "receiver";
  protocolVersion: number;
};

export type FirestoreProtocolDocument = ProtocolDocument & {
  _transport: TransportMetadata;
};

export interface PatientDocument extends ProtocolDocumentBase {
  documentType: DocumentType.Patient;
  schemaId: 1;
  patient: PatientInfo;
}

export interface PatientInfo {
  isDemo: boolean;
  firstName?: string;
  lastName?: string;
  phone?: string;
  details?: string;
  notes: string;
  samples: SampleInfo[];
}

// ================================================================================
// Photo

export interface PhotoDocument extends ProtocolDocumentBase {
  documentType: DocumentType.Photo;
  schemaId: 1;
  photo: PhotoInfo;
}

export interface PhotoInfo {
  timestamp: string;
  photoId: string;
}

export interface PhotoDbInfo extends PhotoInfo {
  jpegBase64: string;
}
