// Copyright (c) 2019 by Audere
//
// Use of this source code is governed by an MIT-style license that
// can be found in the LICENSE file distributed with this file.

import RNDeviceInfo from "react-native-device-info";
import firebase from "react-native-firebase";
import uuidv4 from "uuid/v4";
import {
  AuthUser,
  FirestoreProtocolDocument,
  DocumentType,
  EncounterDocument,
  EncounterInfo,
  EncounterTriageDocument,
  Message,
  MessagingTokenDocument,
} from "audere-lib/ebPhotoStoreProtocol";

const DEFAULT_ENCOUNTER_COLLECTION = "encounters";
const DEFAULT_TRIAGE_COLLECTION = "triages";
const DEFAULT_MESSAGES_COLLECTION = "messages";
const DEFAULT_TOKEN_COLLECTION = "messaging_tokens";

export const DEVICE_INFO = {
  installation: RNDeviceInfo.getInstanceID(),
  clientVersion: loadBuildInfo(),
  clientBuild: RNDeviceInfo.getBuildNumber(),
  idiomText: RNDeviceInfo.getDeviceType(),
  platform: {
    osName: RNDeviceInfo.getSystemName(),
    osVersion: RNDeviceInfo.getSystemVersion(),
  },
};

function loadBuildInfo() {
  try {
    return require("../../buildInfo.json");
  } catch (e) {
    return `${new Date().toISOString}.dev-build-without-buildInfo.json`;
  }
}

function getEncounterCollection() {
  const collectionName =
    process.env.FIRESTORE_ENCOUNTER_COLLECTION || DEFAULT_ENCOUNTER_COLLECTION;
  return firebase.firestore().collection(collectionName);
}

function getMessagesCollection(patientId: string) {
  const collectionName =
    process.env.FIRESTORE_MESSAGE_COLLECTION || DEFAULT_MESSAGES_COLLECTION;
  return getEncounterCollection()
    .doc(patientId)
    .collection(collectionName);
}

function getTriageCollection() {
  const collectionName =
    process.env.FIRESTORE_TRIAGE_COLLECTION || DEFAULT_TRIAGE_COLLECTION;
  return firebase.firestore().collection(collectionName);
}

function getTriageDocument(patientId: string) {
  return getTriageCollection().where("docId", "==", patientId);
}

function getTokenCollection() {
  const collectionName =
    process.env.FIRESTORE_TOKEN_COLLECTION || DEFAULT_TOKEN_COLLECTION;
  return firebase.firestore().collection(collectionName);
}

export async function initializeFirestore() {
  // This enables offline caching
  await firebase.firestore().settings({ persistence: true });
}

export async function syncEncounter(docId: string, encounter: EncounterInfo) {
  const encounterDocument = frame({
    schemaId: 1,
    docId,
    device: DEVICE_INFO,
    documentType: DocumentType.Encounter,
    encounter,
  });
  const doc = getEncounterCollection().doc(docId);
  console.log(`Uploading encounter ${docId}`);
  await doc.set(encounterDocument);
}

export async function uploadToken(phone: string, token: string) {
  console.log("Uploading token");
  const uid = firebase.auth().currentUser!.uid;
  const tokenDoc: MessagingTokenDocument = {
    device: DEVICE_INFO,
    docId: uuidv4(),
    documentType: DocumentType.MessagingToken,
    phone,
    schemaId: 1,
    token,
    uid,
  };
  console.log(JSON.stringify(tokenDoc));
  const doc = getTokenCollection().doc(uid);
  await doc.set(tokenDoc);
}

function frame(document: EncounterDocument): FirestoreProtocolDocument {
  return {
    ...document,
    _transport: {
      sentAt: new Date().toISOString(),
      lastWriter: "sender",
      protocolVersion: 1,
    },
  };
}

export function initializeTriageListener(
  patientId: string,
  callback: (doc: EncounterTriageDocument) => void
): () => void {
  return getTriageDocument(patientId).onSnapshot(snapshot => {
    snapshot.docChanges.forEach(change => {
      const doc = change.doc.data() as EncounterTriageDocument;
      callback(doc);
    });
  });
}

// Ram: React native firebase adds support for collectiongroups in v6,
// which is still in beta as of 7/30/19. Until we upgrade, add a listener
// per patient...
export function initializeMessageListener(
  patientId: string,
  callback: (patientId: string, message: Message) => void
): () => void {
  return getMessagesCollection(patientId).onSnapshot(collection => {
    collection.docChanges.forEach(docChange => {
      const doc = docChange.doc.data() as Message;
      callback(patientId, doc);
    });
  });
}

export async function sendChatMessage(patientId: string, message: Message) {
  const messageDocId = `${message.timestamp}.${message.sender.uid}`;
  const messageDoc = getMessagesCollection(patientId).doc(messageDocId);
  console.log(`Uploading message ${messageDocId}`);
  await messageDoc.set(message);
}

export function getCurrentUserId(): string | null {
  const currentUser = firebase.auth().currentUser;
  return currentUser == null ? null : currentUser.uid;
}
