// Copyright (c) 2019 by Audere
//
// Use of this source code is governed by an MIT-style license that
// can be found in the LICENSE file distributed with this file.

import crypto from "crypto";
import _ from "lodash";
import firebase from "firebase-admin";
import {
  connectorFromSqlSecrets,
  FirebaseReceiver,
} from "../../src/external/firebase";
import { createSplitSql, SplitSql } from "../../src/util/sql";

type App = firebase.app.App;
type DocumentSnapshot = firebase.firestore.DocumentSnapshot;

const DOC_ID0 = "DocumentId0";
const DOC0 = {
  docid: DOC_ID0,
  key: "value0",
};

const DOC_ID1 = "DocumentId1";
const DOC1 = {
  docid: DOC_ID1,
  key: "value1",
};

describe("FirebaseReceiver", () => {
  let sql;
  let app;
  let firestore;

  beforeAll(async () => {
    sql = await createSplitSql();
    app = await appOrNull(sql);
    if (app != null) {
      firestore = app.firestore();
    }
  });

  afterAll(async () => await sql.close());

  it("receives one message", async () => {
    if (app == null) return;
    const { collection, receiver } = await setup("OneMessage");

    await collection.doc(DOC_ID0).set(wireDoc(DOC0));
    expect(await receiver.updates()).toEqual([DOC_ID0]);
    const received0 = checkDoc(DOC0, await receiver.read(DOC_ID0));
    expect(await receiver.markAsRead(received0)).toEqual(true);
    expect(await receiver.updates()).toEqual([]);
    await clear(collection);
  });

  it("receives again if unmarked", async () => {
    if (app == null) return;
    const { collection, receiver } = await setup("ReceiveTwice");

    await collection.doc(DOC_ID0).set(wireDoc(DOC0));
    expect(await receiver.updates()).toEqual([DOC_ID0]);
    checkDoc(DOC0, await receiver.read(DOC_ID0));
    // Re-requesting updates should be idempotent if we didn't mark anything read.
    expect(await receiver.updates()).toEqual([DOC_ID0]);
    await clear(collection);
  });

  it("receives two messages", async () => {
    if (app == null) return;
    const { collection, receiver } = await setup("TwoMessages");

    await collection.doc(DOC_ID0).set(wireDoc(DOC0));
    await collection.doc(DOC_ID1).set(wireDoc(DOC1));
    expect(await receiver.updates()).toEqual([DOC_ID0, DOC_ID1]);
    const received0 = checkDoc(DOC0, await receiver.read(DOC_ID0));
    expect(await receiver.markAsRead(received0)).toEqual(true);
    const received1 = checkDoc(DOC1, await receiver.read(DOC_ID1));
    expect(await receiver.markAsRead(received1)).toEqual(true);
    expect(await receiver.updates()).toEqual([]);
    await clear(collection);
  });

  it("handles concurrent update", async () => {
    if (app == null) return;
    const { collection, receiver } = await setup("ConcurrentUpdate");

    await collection.doc(DOC_ID0).set(wireDoc(DOC0));
    expect(await receiver.updates()).toEqual([DOC_ID0]);
    const received0 = checkDoc(DOC0, await receiver.read(DOC_ID0));
    await collection
      .doc(DOC_ID0)
      .set(wireDoc({ ...DOC0, updatedContent: true }));
    expect(await receiver.markAsRead(received0)).toEqual(false);
    expect(await receiver.updates()).toEqual([DOC_ID0]);
    await clear(collection);
  });

  async function setup(scenario: string) {
    const name = collectionName(scenario);
    const collection = firestore.collection(name);
    const receiver = new FirebaseReceiver(async () => app, {
      collection: name,
    });

    await clear(collection);
    return { collection, receiver };
  }
});

type CollectionReference = firebase.firestore.CollectionReference;
async function clear(collection: CollectionReference): Promise<void> {
  for (let doc of [DOC_ID0, DOC_ID1]) {
    await collection.doc(doc).delete();
  }
}

function checkDoc(expected: any, actual: DocumentSnapshot): DocumentSnapshot {
  expect(actual).not.toBeNull();
  const data = actual.data();
  expect(data.docid).toEqual(expected.docid);
  expect(data.key).toEqual(expected.key);
  return actual;
}

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

function wireDoc(content: object): object {
  return {
    _transport: clientTransportFrame(hash(JSON.stringify(content))),
    ...content,
  };
}

function clientTransportFrame(hash: string) {
  return {
    sentAt: new Date().toISOString(),
    contentHash: hash,
    lastWriter: "sender",
    protocolVersion: 1,
  };
}

function collectionName(base: string): string {
  return `Test${base}-${process.env["USER"]}`;
}
