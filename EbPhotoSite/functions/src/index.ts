// Copyright (c) 2019 by Audere
//
// Use of this source code is governed by an MIT-style license that
// can be found in the LICENSE file distributed with this file.

import * as functions from 'firebase-functions';
import * as admin from "firebase-admin";
import { NotificationRequest } from "audere-lib/dist/ebPhotoStoreProtocol";

admin.initializeApp();

export const notify = functions.https.onCall(async (data, context) => {
  if (context.auth == null) {
    console.error(`Received unauthorized notification request`);
    return;
  } else {
    console.log(`Received notification request from ${context.auth.uid}`);
  }

  const notification = data as NotificationRequest;

  const payload = {
    data: {
      document: JSON.stringify(notification.notification)
    },
    notification: {
      title: notification.title,
      body: notification.body
    }
  };

  let options = {};
  if (notification.group != null) {
    options = { collapseKey: notification.group };
  }

  const sendResponse = await admin.messaging().sendToDevice(
    notification.token,
    payload,
    options
  );

  const result = sendResponse.results[0];

  if (result.error != null) {
    console.error(`Notification was not sent successfully: ` +
      result.error.message);
  }
});