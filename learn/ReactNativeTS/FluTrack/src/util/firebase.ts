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

export const FirestoreCollection = {
  BARCODES: "barcodes",
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

export async function writeBarcodeToFirebase(barcode: string, uid: string) {
  const data = {
    barcode,
    uid,
    installation_id: DEVICE_INFO.installation,
    device_name: DEVICE_INFO.deviceName,
    client_version: DEVICE_INFO.clientVersion,
    device_local_time: format(new Date(), "YYYY-MM-DD HH:mm:ss"),
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
