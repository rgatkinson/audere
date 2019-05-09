// Copyright (c) 2019 by Audere
//
// Use of this source code is governed by an MIT-style license that
// can be found in the LICENSE file distributed with this file.

import crypto from "crypto";
import _ from "lodash";
import firebase from "firebase-admin";
import { connectorFromSqlSecrets, FirebaseReceiver } from "../../src/external/firebase";
import { createSplitSql, SplitSql } from "../../src/util/sql";

type App = firebase.app.App;
type Firestore = firebase.firestore.Firestore;
type DocumentSnapshot = firebase.firestore.DocumentSnapshot;
type Storage = firebase.storage.Storage;

const FieldPath = firebase.firestore.FieldPath;

describe("FirebaseReceiver", async () => {
  let sql;
  let app;
  let firestore;
  let storage;

  beforeAll(async () => {
    sql = await createSplitSql();
    app = await appOrNull(sql);
    if (app != null) {
      firestore = app.firestore();
      storage = app.storage();
    }
  });

  afterAll(async () => {
    await sql.close();
  });

  it("receives one message", async () => {
    if (app == null) {
      return;
    }
    const collection = `TestOneMessage-${process.env["USER"]}`;

    const docid0 = "DocumentId0";
    const doc0 = {
      docid: docid0,
      key: "value0",
    };
    const hash0 = hash(JSON.stringify(doc0));

    await firestore.collection(collection).doc(docid0).delete();
    await firestore.collection(collection)
      .doc(docid0)
      .set({
        _transport: {
          clientTimestamp: new Date().toISOString(),
          contentHash: hash0,
          lastWriter: "client",
          protocolVersion: 1,
        },
        ...doc0,
      });

    const receiver = new FirebaseReceiver(async () => app, {collection});

    const updates = await receiver.updates();
    expect(updates).toHaveLength(1);
    expect(updates[0]).toEqual(docid0);

    const received0 = await receiver.read(docid0);
    expect(received0).not.toBeNull();
    const receivedData0 = received0.data();
    expect(receivedData0.docid).toEqual(docid0);
    expect(receivedData0.key).toEqual("value0");

    const marked = await receiver.markAsRead(received0);
    expect(marked).toEqual(true);
  });
});

async function appOrNull(sql: SplitSql): Promise<App | null> {
  try {
    return await connectorFromSqlSecrets(sql)();
  } catch (err) {
    console.log(`Skipping Firebase integration test: ${err.message}`);
    return null;
  }
}

function hash(...args: (string | Buffer)[]): string {
  const hash = crypto.createHash("sha256");
  args.forEach(arg => hash.update(arg));
  return hash.digest("hex").toString();
}
