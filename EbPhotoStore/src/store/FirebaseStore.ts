// Copyright (c) 2019 by Audere
//
// Use of this source code is governed by an MIT-style license that
// can be found in the LICENSE file distributed with this file.

import RNDeviceInfo from "react-native-device-info";
import firebase from "react-native-firebase";
import { DocumentReference } from "react-native-firebase/firestore";
import {
  FirestoreProtocolDocument,
  DocumentType,
  EncounterDocument,
  EncounterInfo
} from "audere-lib/ebPhotoStoreProtocol";

const DEFAULT_ENCOUNTER_COLLECTION = "encounters";

const DEVICE_INFO = {
  installation: RNDeviceInfo.getInstanceID(),
  clientVersion: loadBuildInfo(),
  clientBuild: RNDeviceInfo.getBuildNumber(),
  idiomText: RNDeviceInfo.getDeviceType(),
  platform: {
    osName: RNDeviceInfo.getSystemName(),
    osVersion: RNDeviceInfo.getSystemVersion()
  }
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
    encounter
  });
  const doc = getEncounterCollection().doc(docId);
  console.log(docId);
  console.log(JSON.stringify(encounterDocument));
  await doc.set(encounterDocument);
}

function frame(document: EncounterDocument): FirestoreProtocolDocument {
  return {
    ...document,
    _transport: {
      sentAt: new Date().toISOString(),
      lastWriter: "sender",
      protocolVersion: 1
    }
  };
}

export async function uploadPhoto(docId: string) {}
