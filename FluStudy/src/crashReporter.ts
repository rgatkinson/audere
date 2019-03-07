import { uploader } from "./store/uploader";
import { ErrorRecovery } from "expo";
import { Crashlytics } from "react-native-fabric";
import DeviceInfo from "react-native-device-info";
import { AnyAction, Dispatch, MiddlewareAPI } from "redux";

export type ErrorProps = {
  errorMessage: string;
};

let defaultErrorHandler = (error: Error, isFatal?: boolean) => {};

function recordErrorToFirebase(e: Error) {
  const firstNewline = e.message.indexOf("\n");
  const domain =
    firstNewline > 0 ? e.message.substr(0, firstNewline) : "JS Error";

  Crashlytics.recordError({
    domain,
    userInfo: e.message,
  });
}

export function uploadingErrorHandler(e: Error, isFatal?: boolean) {
  const errorMessage = e.message + "\n" + e.stack;

  recordErrorToFirebase(e);
  if (isFatal) {
    const errorProps: ErrorProps = { errorMessage };
    ErrorRecovery.setRecoveryProps(errorProps);
  } else {
    uploader.saveCrashLog(errorMessage);
  }
  defaultErrorHandler(e, isFatal);
}

export function setupErrorHandler() {
  defaultErrorHandler = ErrorUtils.getGlobalHandler();
  if (defaultErrorHandler !== uploadingErrorHandler) {
    ErrorUtils.setGlobalHandler(uploadingErrorHandler);
  }

  Crashlytics.setUserIdentifier(DeviceInfo.getUniqueID());
}

export function reportPreviousCrash(errorProps?: ErrorProps) {
  if (!errorProps) {
    return;
  }
  uploader.saveCrashLog(errorProps.errorMessage);
}

export function crashReportingDetailsMiddleware(store: MiddlewareAPI) {
  return (next: Dispatch) => (action: AnyAction) => {
    if (action.type === "SET_EMAIL" && action.email) {
      Crashlytics.setUserEmail(action.email);
    }
    return next(action);
  };
}
