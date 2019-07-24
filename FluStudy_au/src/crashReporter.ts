// Copyright (c) 2018 by Audere
//
// Use of this source code is governed by an MIT-style license that
// can be found in the LICENSE file distributed with this file.

// Try not to create a dependency cycle here.  crashReporter should hopefully
// not need anything else from our project, but instead only pull from third
// party libraries so that it can be used anywhere in our project.

import firebase from "react-native-firebase";
import { AnyAction, Dispatch, MiddlewareAPI } from "redux";
import Constants from "expo-constants";
import { memoize } from "./util/memoize";

export type ErrorProps = {
  errorMessage: string;
};

export const crashlytics = firebase.crashlytics();

// The latest react-native-firebase uses a different signature than the
// outdated Fabric version (react-native-fabric).  The firebase version takes
// a numeric code for bucketing instead of a string.  So we hash the leading
// line of error messages into a repeatable code in order to retain bucketing.
function hashCode(s: string): number {
  let h = 0;
  for (let i = 0; i < s.length; i++)
    h = (Math.imul(31, h) + s.charCodeAt(i)) | 0;

  return h;
}

export function recordErrorToFirebase(e: Error) {
  const firstNewline = e.message.indexOf("\n");
  const domain = hashCode(
    firstNewline > 0 ? e.message.substr(0, firstNewline) : "JS Error"
  );

  crashlytics.recordError(domain, e.message);
}

export function crashReportingDetailsMiddleware(store: MiddlewareAPI) {
  const setInstallationIdOnce = memoize(() => {
    crashlytics.setStringValue("installation_id", Constants.installationId);
  });
  return (next: Dispatch) => (action: AnyAction) => {
    if (action.type === "SET_EMAIL" && action.email) {
      crashlytics.setStringValue("user_email", action.email);
    }
    setInstallationIdOnce();
    return next(action);
  };
}
