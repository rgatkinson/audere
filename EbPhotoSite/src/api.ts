// Copyright (c) 2019 by Audere
//
// Use of this source code is governed by an MIT-style license that
// can be found in the LICENSE file distributed with this file.

import { DocumentType, EncounterTriageDocument } from "audere-lib/dist/ebPhotoStoreProtocol";

// TODO: remove
export interface User {
  email: string,
  token: string,
}

const firebase = (global as any).firebase as any;

type QuerySnapshot = any; // firebase.firestore.QuerySnapshot;
type DocumentSnapshot = any; // firebase.firestore.DocumentSnapshot;

const DEFAULT_ENCOUNTER_COLLECTION = "encounters";
const DEFAULT_TRIAGE_COLLECTION = "triages";

function getEncounterCollection() {
  return DEFAULT_ENCOUNTER_COLLECTION;
}

function getTriageCollection() {
  return DEFAULT_TRIAGE_COLLECTION;
}

// Protocol constants
export const PROTOCOL_V1 = 1;
export const SENDER_NAME = "sender";
export const RECEIVER_NAME = "receiver";
export const FIELD_PATH = {
  protocolVersion: "_transport.protocolVersion",
  contentHash: "_transport.contentHash",
  lastWriter: "_transport.lastWriter",
  receivedAt: "_transport.receivedAt",
  sentAt: "_transport.sentAt",
  receivedByUser: "_transport.receivedByUser",
  receivedByHost: "_transport.receivedByHost"
};

export class Api {
  session: Storage;

  constructor() {
    this.session = window.sessionStorage;
  }

  // --------------------------------------
  // CLEANUP

  isAuthenticated(): boolean {
    return ["UserEmail", "UserToken"]
      .every(key => this.session.getItem(key) != null);
  }

  currentUser(): User | null {
    const email = this.session.getItem("UserEmail");
    const token = this.session.getItem("UserToken");
    if (email != null && token != null) {
      return { email, token };
    } else {
      return null;
    }
  }

  async login(email: string, password: string): Promise<User> {
    await this.delay(500);
    if (password === email) {
      throw new Error(`No valid user found with that email and password.`);
    }
    this.session.setItem("UserEmail", email);
    this.session.setItem("UserToken", password);
    return { email, token: password };
  }

  async logout(): Promise<void> {
    this.session.clear();
    await this.delay(500);
  }

  async delay(ms: number) {
    await new Promise(f => setTimeout(f, ms));
  }

  // CLEANUP
  // --------------------------------------

  async loadEncounters(): Promise<QuerySnapshot> {
    const db = firebase.firestore();
    const collection = db.collection(getEncounterCollection());

    const query = collection
      .where(FIELD_PATH.protocolVersion, "==", PROTOCOL_V1)
      .orderBy(FIELD_PATH.sentAt)
      .limit(256);
    return await logIfError("loadEncounters", "get", () => query.get());
  }

  async loadEncounter(docId: string): Promise<DocumentSnapshot> {
    const db = firebase.firestore();
    const collection = db.collection(getEncounterCollection());
    const doc = collection.doc(docId);
    return await logIfError("loadEncounter", "get", () => doc.get());
  }

  async loadTriage(docId: string): Promise<DocumentSnapshot> {
    const db = firebase.firestore();
    const collection = db.collection(getTriageCollection());
    const doc = collection.doc(docId);
    return await logIfError("loadTriage", "get", () => doc.get());
  }

  async saveTriage(triage: EncounterTriageDocument): Promise<void> {
    const db = firebase.firestore();
    const collection = db.collection(getTriageCollection());
    const doc = collection.doc(triage.docId);
    return await logIfError("saveTriage", "set", () => doc.set(triage));
  }

  photoUrl(photoId: string): Promise<string> {
    return firebase.storage()
      .ref(`photos/${photoId}.jpg`)
      .getDownloadURL();
  }
}

async function logIfError<T>(
  func: string,
  location: string,
  call: () => Promise<T>
): Promise<T> {
  try {
    return await call();
  } catch (err) {
    if ((err as any).logged) {
      throw err;
    } else {
      throw logError(func, location, err);
    }
  }
}

function logError(func: string, location: string, err: any): LoggedError {
  const message = err != null ? err.message : "";
  const name = err != null ? err.name : "";
  const summary = `${func}: ${location} threw '${name}': '${message}'`;
  // TODO
  console.log(summary);
  return new LoggedError(summary);
}

class LoggedError extends Error {
  readonly logged: boolean;

  constructor(message: string) {
    super(message);
    this.logged = true;
  }
}

let api: Api | null = null;
export function getApi() {
  if (api == null) {
    api = new Api();
  }
  return api;
}

export function triageDoc(
  docId: string,
  notes: string,
  testIndicatesEVD: boolean
): EncounterTriageDocument {
  return {
    documentType: DocumentType.Triage,
    schemaId: 1,
    docId,
    triage: {
      notes,
      testIndicatesEVD
    }
  };
}
