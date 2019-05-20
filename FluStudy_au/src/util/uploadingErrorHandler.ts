// Copyright (c) 2018 by Audere
//
// Use of this source code is governed by an MIT-style license that
// can be found in the LICENSE file distributed with this file.

// This file exists to break a dependency cycle.  ./store needs to log things
// to crashlytics... but the rest of the app would prefer to both log to
// crashlytics as well as uploader.saveCrashLog().  Putting this here allows
// the app to use it when needed without creating a depedency cycle on ./store.

import { ErrorRecovery } from "expo";
import DeviceInfo from "react-native-device-info";
import {
  crashlytics,
  ErrorProps,
  recordErrorToFirebase,
} from "../crashReporter";
import { reportError } from "./tracker";

let defaultErrorHandler = (error: Error, isFatal?: boolean) => {};

export function setupErrorHandler() {
  defaultErrorHandler = ErrorUtils.getGlobalHandler();
  if (defaultErrorHandler !== uploadingErrorHandler) {
    ErrorUtils.setGlobalHandler(uploadingErrorHandler);
  }

  crashlytics.setUserIdentifier(DeviceInfo.getUniqueID());
}

export function uploadingErrorHandler(
  e: Error,
  isFatal?: boolean,
  prependStr?: string
) {
  const errorMessage =
    prependStr != null ? prependStr + "\n" : "" + e.message + "\n" + e.stack;

  reportError(e);
  if (isFatal) {
    const errorProps: ErrorProps = { errorMessage };
    ErrorRecovery.setRecoveryProps(errorProps);
  }
  defaultErrorHandler(e, isFatal);
}
