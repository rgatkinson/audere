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
  collection: string;
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
  sentAt: "_transport.sentAt"
};

export class FirebaseReceiver {
  config: Config;
  lazyApp: LazyAsync<App>;

  constructor(connector: Connector, config: Config) {
    this.lazyApp = new LazyAsync(connector);
    this.config = config;
  }

  public async healthCheck() {
    const db = await this.firestore();
    const collection = db.collection(this.config.collection);

    const docRef = collection.doc("health-check.json");

    await docRef.set({
      status: "OK"
    });
    const docSnap = await docRef.get();
    const data = await docSnap.data();
    if (data["status"] != "OK") {
      throw new Error();
    }
  }

  public async updates(): Promise<string[]> {
    const db = await this.firestore();
    const collection = db.collection(this.config.collection);

    const query = collection
      .where(FIELD_PATH.lastWriter, "==", SENDER_NAME)
      .where(FIELD_PATH.protocolVersion, "==", PROTOCOL_V1)
      .select(FieldPath.documentId())
      .orderBy(FIELD_PATH.sentAt)
      .limit(256);
    const snapshot = await logIfError("updates", "get", () => query.get());

    return snapshot.docs.map(x => x.id);
  }

  // Returns Firestore document
  public async read(id: string): Promise<DocumentSnapshot> {
    const db = await this.firestore();
    const collection = db.collection(this.config.collection);

    const ref = collection.doc(id);
    const snapshot = await logIfError("read", "get", () => ref.get());

    if (!snapshot.exists) {
      throw new Error(`Could not load document for id '${id}'`);
    }

    return snapshot;
  }

  // Returns Firebase Storage file
  public async download(id: string): Promise<Buffer> {
    const storage = await this.storage();
    const projectId = await this.projectId();
    const bucketName = `gs://${projectId}.appspot.com`;
    const bucket = storage.bucket(bucketName);
    const filename = `${this.config.collection}/${id}`;
    const file = bucket.file(filename);
    const [buffer] = await logIfError(
      "download",
      `${bucketName}:${filename}`,
      () => file.download()
    );
    return buffer;
  }

  public async markAsRead(doc: DocumentSnapshot): Promise<boolean> {
    const id = doc.id;
    const hash = doc.get(FIELD_PATH.contentHash);
    const db = await this.firestore();
    const collection = db.collection(this.config.collection);
    const docRef = collection.doc(id);

    try {
      await logIfError("markAsRead", "runTransaction", () =>
        db.runTransaction(async transaction => {
          const doc = await logIfError("markAsRead", "get", () =>
            transaction.get(docRef)
          );
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

          transaction.update(docRef, update);
        })
      );
      logger.debug(`FirebaseReceiver.markAsRead '${id}'@'${hash}' succeeded`);
      return true;
    } catch (err) {
      logger.debug(
        `FirebaseReceiver.markAsRead '${id}'@'${hash}' ${err.message}`
      );
      return false;
    }
  }

  // CONSIDER: I don't see a documented way to get the current project id,
  // but it seems more fragile to specify it twice, both in the credentials
  // and in config.
  private async projectId(): Promise<string> {
    return ((await this.lazyApp.get()).auth() as any).projectId;
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
  return async () =>
    theOneApp ||
    getOrCreateApp(
      await logIfError("connectorFromSecrets", "getMaybeEnvFile", () =>
        new SecretConfig(sql).getMaybeEnvFile("FIREBASE_TRANSPORT_CREDENTIALS")
      )
    );
}

export function connectorFromFilename(path: string): Connector {
  return async () =>
    theOneApp ||
    getOrCreateApp(
      await logIfError("connectorFromFilename", "readFile", () =>
        fsPromise.readFile(path, { encoding: "utf8" })
      )
    );
}

export function connectorFromCredentials(
  credentials: Promise<string>
): Connector {
  return async () =>
    theOneApp ||
    getOrCreateApp(
      await logIfError(
        "connectorFromCredentials",
        "credentials",
        () => credentials
      )
    );
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
  logger.error(summary);
  return new LoggedError(summary);
}

class LoggedError extends Error {
  readonly logged: boolean;

  constructor(message: string) {
    super(message);
    this.logged = true;
  }
}
