// Copyright (c) 2018 by Audere
//
// Use of this source code is governed by an MIT-style license that
// can be found in the LICENSE file distributed with this file.
//
// Everything in this file try/catches from paranoia, because we don't want
// the irony of our debugging attempts to cause even more issues.

import firebase from "firebase";
import "firebase/firestore";
import { DEVICE_INFO } from "../transport/DeviceInfo";
import { format } from "date-fns";
import { VisitInfo } from "audere-lib/snifflesProtocol";
import { Crypt } from "hybrid-crypto-js";

const backupPublicKey =
  "-----BEGIN PUBLIC KEY-----\
  MIIBIjANBgkqhkiG9w0BAQEFAAOCAQ8AMIIBCgKCAQEAwOm4OEe8w3010YV3hVyb\
  CPusZSz4DyThkd30FYkW1dcAdFoCFnQiYVoMkGUNiQzXAeb748nnzyAX1BQqCfMu\
  ruAfJ8FcRy/hq+g7JZMNj/H0kjTMCHofl9rkhqplPBZYBEYAAneV6wgGCSmwopcb\
  d3klGPnDG14f8JhPwrXnqBYOK8aCGVXSLzq0D3AtNqkC5Wwki+auSYoOLweybgJy\
  rXpCXZM4jbGHWTNP9xMz8m4M0flj/VImiuv/U6RzGcCvRBGXWea2XJQ/PuN8dWE/\
  ByiP2JvtK6KHIBNUJ72LWgjOPmH2XPmqNGJHZeMi/ucXl/Uf/QvTnr/GI4bbjFk7\
  2wIDAQAB\
  -----END PUBLIC KEY-----";
export const FirestoreCollection = {
  BARCODES: "barcodes",
  EMPTY_DOC_UIDS: "emptyDocUids",
};

export function initializeFirebase() {
  try {
    var config = {
      apiKey: process.env.FIREBASE_API_KEY,
      authDomain: "audereflutrack.firebaseapp.com",
      databaseURL: "https://audereflutrack.firebaseio.com",
      projectId: "audereflutrack",
      storageBucket: "audereflutrack.appspot.com",
      messagingSenderId: "680270358150",
    };
    firebase.initializeApp(config);
  } catch (e) {
    // ...
  }
}

export async function backupToFirebase(
  barcode: string,
  uid: string,
  visit: VisitInfo
) {
  const crypt = new Crypt();
  const encryptedData = crypt.encrypt(backupPublicKey, JSON.stringify(visit));
  const data = {
    barcode,
    uid,
    installation_id: DEVICE_INFO.installation,
    device_name: DEVICE_INFO.deviceName,
    client_version: DEVICE_INFO.clientVersion,
    device_local_time: format(new Date(), "YYYY-MM-DD HH:mm:ss"),
    encrypted_visit_info: encryptedData,
  };

  try {
    firebase
      .firestore()
      .collection(FirestoreCollection.BARCODES)
      .doc(barcode)
      .set(data);
  } catch (e) {
    // ...
  }
}

export function logEmptyDocId(pouchId: string, step: string) {
  const [_, priority, uid] = pouchId.split("/");
  try {
    firebase
      .firestore()
      .collection(FirestoreCollection.EMPTY_DOC_UIDS)
      .doc(uid)
      .set({
        uid,
        priority,
        installation_id: DEVICE_INFO.installation,
        device_name: DEVICE_INFO.deviceName,
        client_version: DEVICE_INFO.clientVersion,
        device_local_time: format(new Date(), "YYYY-MM-DD HH:mm:ss"),
        step,
      });
  } catch (e) {}
}

// To be used only internally.  You'll have to provide the private key, BTW.
// For data recovery purposes.
async function decryptFromFirebase(barcode: string) {
  const privateKey = "<Your Super Secret Key Here>";
  const snap = await firebase
    .firestore()
    .collection(FirestoreCollection.BARCODES)
    .doc(barcode)
    .get();

  if (!snap.exists) {
    console.log(`Barcode ${barcode} unfortunately can't be found`);
    return;
  }
  const crypt = new Crypt();
  const decryptedData = crypt.decrypt(
    privateKey,
    snap.data()!.encrypted_visit_info
  );

  console.log(
    `Barcode ${barcode} decrypts to:\n${JSON.stringify(decryptedData)}\n\n`
  );
}
