// Copyright (c) 2019 by Audere
//
// Use of this source code is governed by an MIT-style license that
// can be found in the LICENSE file distributed with this file.

import firebase from "react-native-firebase";
import { DocumentReference } from "react-native-firebase/firestore";
import { DEVICE_INFO } from "../transport/DeviceInfo";
import {
  AppHealthEvents,
  logFirebaseEvent,
  TransportEvents,
} from "../util/tracker";
import { sha256 } from "js-sha256";
import {
  FirestoreProtocolDocument,
  SurveyNonPIIInfo,
  DocumentType,
  ProtocolDocument,
} from "audere-lib/chillsProtocol";

const DEFAULT_SURVEY_COLLECTION = "surveys";
const DEFAULT_PHOTO_COLLECTION = "photos";

function getSurveyCollection() {
  const collectionName =
    process.env.FIRESTORE_SURVEY_COLLECTION || DEFAULT_SURVEY_COLLECTION;
  return firebase.firestore().collection(collectionName);
}

export function photoCollectionName() {
  return process.env.FIRESTORE_PHOTO_COLLECTION || DEFAULT_PHOTO_COLLECTION;
}
function getPhotoCollection() {
  return firebase.firestore().collection(photoCollectionName());
}

export async function initializeFirestore() {
  // This enables offline caching
  await firebase.firestore().settings({ persistence: true });
}

export async function syncSurvey(docId: string, survey: SurveyNonPIIInfo) {
  try {
    const surveyDocument: FirestoreProtocolDocument = frame({
      schemaId: 1,
      docId,
      device: DEVICE_INFO,
      documentType: DocumentType.Survey,
      survey,
    });
    const doc = getSurveyCollection().doc(docId);
    await doc.set(surveyDocument);
    logFirebaseEvent(TransportEvents.SURVEY_SYNCED, { docId, path: doc.path });
  } catch (e) {
    logFirebaseEvent(AppHealthEvents.FIRESTORE_SAVE_SURVEY_ERROR, {
      docId,
      error: e.message,
    });
  }
}

export async function syncPhoto(docId: string) {
  try {
    const photoDocument: FirestoreProtocolDocument = frame({
      schemaId: 1,
      docId: docId,
      device: DEVICE_INFO,
      documentType: DocumentType.Photo,
      photo: {
        timestamp: new Date().toISOString(),
        photoId: docId,
      },
    });
    const doc = getPhotoCollection().doc(docId);
    await doc.set(photoDocument);
    logFirebaseEvent(TransportEvents.PHOTO_SYNCED, { docId, path: doc.path });
  } catch (e) {
    logFirebaseEvent(AppHealthEvents.FIRESTORE_SAVE_PHOTO_ERROR, {
      docId,
      error: e.message,
    });
  }
}

function frame(document: ProtocolDocument): FirestoreProtocolDocument {
  return {
    ...document,
    _transport: {
      sentAt: new Date().toISOString(),
      contentHash: sha256(JSON.stringify(document)),
      lastWriter: "sender",
      protocolVersion: 1,
    },
  };
}
