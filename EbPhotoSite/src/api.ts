// Copyright (c) 2019 by Audere
//
// Use of this source code is governed by an MIT-style license that
// can be found in the LICENSE file distributed with this file.

import {
  AuthUser,
  EncounterDocument,
  EncounterTriageDocument,
  Message,
  MessagingTokenDocument,
  Notification,
} from "audere-lib/dist/ebPhotoStoreProtocol";
import * as Firebase from "firebase";

const firebase = (global as any).firebase as typeof Firebase;

type QuerySnapshot = Firebase.firestore.QuerySnapshot;
type DocumentSnapshot = Firebase.firestore.DocumentSnapshot;
export type FirebaseUnsubscriber = () => void;

const DEFAULT_ENCOUNTER_COLLECTION = "encounters";
const DEFAULT_MESSAGES_COLLECTION = "messages";
const DEFAULT_TOKEN_COLLECTION = "messaging_tokens";
const DEFAULT_TRIAGE_COLLECTION = "triages";

function getEncounterCollection() {
  return DEFAULT_ENCOUNTER_COLLECTION;
}

function getMessagesCollection() {
  return DEFAULT_MESSAGES_COLLECTION;
}

function getTokenCollection() {
  return DEFAULT_TOKEN_COLLECTION;
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
  receivedByHost: "_transport.receivedByHost",
};

export class Api {
  session: Storage;

  constructor() {
    this.session = window.sessionStorage;
  }

  // --------------------------------------
  // CLEANUP

  async logout(): Promise<void> {
    await firebase.auth().signOut();
  }

  async delay(ms: number) {
    await new Promise(f => setTimeout(f, ms));
  }

  async pushNotification(
    token: string,
    title: string,
    body: string,
    notification: Notification,
    messageGroup?: string
  ): Promise<void> {
    const notificationRequest = {
      token: token,
      group: messageGroup,
      title: title,
      body: body,
      notification: notification,
    };

    const notify = firebase.functions().httpsCallable("notify");
    await notify(notificationRequest);
  }

  // CLEANUP
  // --------------------------------------

  now(): string {
    return firebase.firestore.Timestamp.now()
      .toDate()
      .toISOString();
  }

  getMessagesReference(docId: string): Firebase.firestore.CollectionReference {
    const db = firebase.firestore();
    const collection = db
      .collection(getEncounterCollection())
      .doc(docId)
      .collection(getMessagesCollection());

    return collection;
  }

  async getRegistrationToken(
    phone: string
  ): Promise<MessagingTokenDocument | null> {
    const db = firebase.firestore();
    const collection = db.collection(getTokenCollection());

    const query = collection.where("phone", "==", phone).limit(1);
    const result = await logIfError("getRegistrationToken", "get", () =>
      query.get()
    );

    if (result.size > 0) {
      const data = result.docs[0].data() as MessagingTokenDocument;
      return data;
    } else {
      return null;
    }
  }

  private encounterQuery() {
    const db = firebase.firestore();
    const collection = db.collection(getEncounterCollection());
    return collection
      .where(FIELD_PATH.protocolVersion, "==", PROTOCOL_V1)
      .orderBy(FIELD_PATH.sentAt)
      .limit(256);
  }

  async loadEncounters(): Promise<QuerySnapshot> {
    const query = this.encounterQuery();
    return await logIfError("loadEncounters", "get", () => query.get());
  }

  async loadEncounter(docId: string): Promise<DocumentSnapshot> {
    const db = firebase.firestore();
    const collection = db.collection(getEncounterCollection());
    const doc = collection.doc(docId);
    return await logIfError("loadEncounter", "get", () => doc.get());
  }

  listenForEncounters(
    callback: (snapshot: EncounterDocument[]) => void
  ): FirebaseUnsubscriber {
    return this.encounterQuery().onSnapshot(snapshot =>
      callback(snapshot.docs.map(doc => doc.data()) as EncounterDocument[])
    );
  }

  listenForEncounter(
    eDocId: string,
    callback: (snapshot: EncounterDocument) => void
  ): FirebaseUnsubscriber {
    const db = firebase.firestore();
    const collection = db.collection(getEncounterCollection());

    return collection.doc(eDocId).onSnapshot(snap => {
      callback(snap.data() as EncounterDocument);
    });
  }

  async loadTriage(docId: string): Promise<DocumentSnapshot> {
    const db = firebase.firestore();
    const collection = db.collection(getTriageCollection());
    const doc = collection.doc(docId);
    return await logIfError("loadTriage", "get", () => doc.get());
  }

  private triageQuery() {
    const db = firebase.firestore();
    const collection = db.collection(getTriageCollection());
    return collection.limit(256);
  }

  async loadTriages(): Promise<QuerySnapshot> {
    const query = this.triageQuery();
    return await logIfError("loadTriages", "get", () => query.get());
  }

  listenForTriages(
    callback: (snapshot: EncounterTriageDocument[]) => void
  ): FirebaseUnsubscriber {
    return this.triageQuery().onSnapshot(snapshot =>
      callback(snapshot.docs.map(doc =>
        doc.data()
      ) as EncounterTriageDocument[])
    );
  }

  listenForTriage(
    tDocId: string,
    callback: (snapshot: EncounterTriageDocument) => void
  ): FirebaseUnsubscriber {
    const db = firebase.firestore();
    const collection = db.collection(getTriageCollection());

    return collection.doc(tDocId).onSnapshot(snap => {
      callback(snap.data() as EncounterTriageDocument);
    });
  }

  async saveTriage(triage: EncounterTriageDocument): Promise<void> {
    const db = firebase.firestore();
    const collection = db.collection(getTriageCollection());
    const doc = collection.doc(triage.docId);
    return await logIfError("saveTriage", "set", () => doc.set(triage));
  }

  async sendMessage(
    docId: string,
    sender: Firebase.User,
    message: string
  ): Promise<void> {
    const timestamp = this.now();
    const contents = {
      timestamp: timestamp,
      sender: {
        uid: sender.uid,
        name: sender.displayName,
      },
      content: message,
    };

    const ref = this.getMessagesReference(docId);
    const doc = ref.doc(`${timestamp}.${sender.uid}`);

    return await logIfError("sendMessage", "set", () => doc.set(contents));
  }

  photoUrl(photoId: string): Promise<string> {
    return firebase
      .storage()
      .ref(`photos/${photoId}.jpg`)
      .getDownloadURL();
  }

  // TODO(ram): See if this can be made into a collection group query
  listenForLatestMessage(
    encounterDocID: string,
    callback: (message: Message) => void
  ): () => void {
    return this.getMessagesReference(encounterDocID)
      .orderBy("timestamp", "desc")
      .limit(1)
      .onSnapshot(snapshot => {
        if (snapshot.docs.length > 0) {
          callback(snapshot.docs[0].data() as Message);
        }
      });
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

export async function getAuthUser(): Promise<AuthUser> {
  let currentUser = firebase.auth().currentUser;
  if (!currentUser) {
    currentUser = await new Promise((res, rej) =>
      firebase.auth().onAuthStateChanged(res)
    );
    if (currentUser === null) {
      throw new Error("Auth failed");
    }
  }
  return {
    uid: currentUser.uid,
    name: currentUser.displayName || currentUser.email || "",
  };
}
