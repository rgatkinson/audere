// Copyright (c) 2019 by Audere
//
// Use of this source code is governed by an MIT-style license that
// can be found in the LICENSE file distributed with this file.

import { promises as fsPromise } from "fs";
import firebase from "firebase-admin";
import { LazyAsync } from "../util/lazyAsync";
import { SecretConfig } from "../util/secretsConfig";
import { SplitSql } from "../util/sql";
import logger from "../util/logger";

type App = firebase.app.App;
type Firestore = firebase.firestore.Firestore;
type DocumentSnapshot = firebase.firestore.DocumentSnapshot;
type Storage = firebase.storage.Storage;

const FieldPath = firebase.firestore.FieldPath;

export interface Connector {
  (): Promise<App>;
}

export interface Config {
  collection?: string;
}

const DEFAULT_CONFIG = {
  collection: "documents"
};

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
};

export class FirebaseReceiver {
  config: typeof DEFAULT_CONFIG;
  lazyApp: LazyAsync<App>;

  constructor(connector: Connector, config = {}) {
    this.lazyApp = new LazyAsync(connector);
    this.config = { ...DEFAULT_CONFIG, ...config };
  }

  public async updates(): Promise<string[]> {
    const db = await this.firestore();
    const collection = db.collection(this.config.collection);

    const snapshot = await collection
      .where(FIELD_PATH.lastWriter, "==", SENDER_NAME)
      .where(FIELD_PATH.protocolVersion, "==", PROTOCOL_V1)
      .select(FieldPath.documentId())
      .orderBy(FIELD_PATH.sentAt)
      .limit(256)
      .get();

    return snapshot.docs.map(x => x.id);
  }

  public async read(id: string): Promise<DocumentSnapshot> {
    const db = await this.firestore();
    const collection = db.collection(this.config.collection);

    const snapshot = await collection.doc(id).get();

    if (!snapshot.exists) {
      throw new Error(`Could not load document for id '${id}'`);
    }

    return snapshot;
  }

  public async markAsRead(doc: DocumentSnapshot): Promise<boolean> {
    const id = doc.id;
    const hash = doc.get(FIELD_PATH.contentHash);
    const db = await this.firestore();
    const collection = db.collection(this.config.collection);
    const docRef = collection.doc(id);

    try {
      await db.runTransaction(async t => {
        const doc = await t.get(docRef);
        if (!doc.exists) {
          throw new Error(`Could not load document for id '${id}'`);
        }
        if (doc.get(FIELD_PATH.lastWriter) !== SENDER_NAME) {
          throw new Error(
            `CONSISTENCY ERROR: '${id}' was not last written by sender`
          );
        }
        if (doc.get(FIELD_PATH.contentHash) !== hash) {
          throw new Error(`Document '${id}' was modified since last read`);
        }

        const update = {};
        update[FIELD_PATH.lastWriter] = RECEIVER_NAME;
        update[FIELD_PATH.receivedAt] = new Date().toISOString();

        await t.update(docRef, update);
      });
      logger.debug(`FirebaseReceiver.markAsRead '${id}'@'${hash}' succeeded`);
      return true;
    } catch (err) {
      logger.debug(
        `FirebaseReceiver.markAsRead '${id}'@'${hash}' ${err.message}`
      );
      return false;
    }
  }

  async firestore(): Promise<Firestore> {
    return (await this.lazyApp.get()).firestore();
  }

  async storage(): Promise<Storage> {
    return (await this.lazyApp.get()).storage();
  }
}

let theOneApp: firebase.app.App | null = null;

export function connectorFromSqlSecrets(sql: SplitSql): Connector {
  return async () => theOneApp || getOrCreateApp(
    await new SecretConfig(sql).getMaybeEnvFile("FIREBASE_TRANSPORT_CREDENTIALS")
  );
}

export function connectorFromFilename(path: string): Connector {
  return async () => theOneApp || getOrCreateApp(
    await fsPromise.readFile(path, { encoding: "utf8" })
  );
}

export function connectorFromCredentials(
  credentials: Promise<string>
): Connector {
  return async () => theOneApp || getOrCreateApp(await credentials);
}

// Firebase gets offended if you try to initialize it more than once,
// or if you access the app before initializing it.
function getOrCreateApp(credentials: string): firebase.app.App {
  if (theOneApp == null) {
    theOneApp = firebase.initializeApp({
      credential: firebase.credential.cert(JSON.parse(credentials))
    });
  }
  return theOneApp;
}
