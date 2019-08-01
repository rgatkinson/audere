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
  clientBuild: string;
  idiomText: string;
  platform: object;
}

export enum DocumentType {
  Encounter = "ENCOUNTER",
  Triage = "TRIAGE",
  MessagingToken = "MESSAGING_TOKEN",
  Notification = "NOTIFICATION",
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
  rdtPhotos: PhotoInfo[];
  notes: string;
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
  details?: string;
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

// ========================================
// Message
//
// In Firestore, these go in a collection called "messages" inside
// an EncounterDocument, representing a set of messages exchanged
// that are related to that encounter.  Both ends of the conversation
// write messages here.
//
// For now, the name of each message is `${timestamp}.${sender.uid}`
// to guarantee stable sorting that should approximate message send
// order.

export interface Message {
  timestamp: string; // new Date().toISOString()
  sender: AuthUser;
  content: string;
}

export interface AuthUser {
  uid: string; // user.uid
  name: string; // human-readable name of user, e.g. email
}

// ========================================
// Diagnosis
//
// In Firestore, these go in a collection called "diagnoses" inside
// an EncounterDocument, representing a set of diagnoses based on the
// photo(s) uploaded.
//
// Typically there will be only one diagnosis per condition tested by
// the RDT, per encounter.
//

export interface Diagnosis {
  tag: ConditionTag; // Identify a specific condition the RDT tests for.
  value: boolean;    // Did the RDT indicate the presence of this condition?
  notes?: string;    // Any notes associated with the diagnosis.
}

export enum ConditionTag {
  Ebola = "EBOLA", // TODO: this should be the proper name of the RDT.
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

// ========================================
// CHW tokens

// Clients need to specify a registration token for push messaging which the
// server can access. This is used to route messages to devices. We will store
// these tokens in a lookup.
//
// Eventually we want to invert the encounters to remove CHW information and
// put encounters underneath CHW in hierarchy, assuming this allows for rules
// to restrict access. Such a change would also be more likely to keep CHW
// information up to date.
//
// Tokens are refreshed when:
//
// * App deletes Instance ID
// * App is restored on a new device
// * User uninstalls/reinstall the app
// * User clears app data

export interface MessagingTokenDocument extends ProtocolDocumentBase {
  documentType: DocumentType.MessagingToken;
  schemaId: 1;
  uid: string;
  phone: string;
  token: string;
}

// ========================================
// Notification

// Patient id matches a local identifier generated by the client within the
// specified document.

export interface Notification extends ProtocolDocumentBase {
  documentType: DocumentType.Notification;
  schemaId: 1;
  localIndex: string;
  docId: string;
  notificationType: NotificationType;
}

export enum NotificationType {
  Chat = "CHAT",
  Diagnosis = "DIAGNOSIS",
}

export interface NotificationRequest {
  token: string;
  group: string;
  title: string;
  body: string;
  notification: Notification;
}
