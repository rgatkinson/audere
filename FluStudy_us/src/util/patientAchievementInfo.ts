import axios from "axios";
import i18n from "i18next";
import { Alert, NativeModules } from "react-native";
import { getStore, setPatientAchievementInfo, StoreState } from "../store";
import { PatientAchievementInfo } from "../store/meta";
import { getApiBaseUrl } from "../transport";
import { createAccessKey } from "./accessKey";
import base64url from "base64url";
import { AppHealthEvents, logFirebaseEvent } from "./tracker";
import { getDevice } from "../transport/DeviceInfo";

export async function getBarcodeNextScreen() {
  const store = await getStore();
  const state: StoreState = store.getState();
  if (!state.survey.kitBarcode) {
    return "BarcodeContactSupport";
  }

  if (!state.meta.isConnected) {
    return "BarcodeConnectionToServerError";
  }

  const secret = createAccessKey();
  const patientAchievementInfo = await getPatientAchievementInfo(
    state.survey.kitBarcode.code,
    state.survey.csruid || "",
    secret,
    state.meta.isDemo
  );
  if (patientAchievementInfo.email.length > 0) {
    // Success - barcode matches with Achievement record
    store.dispatch(setPatientAchievementInfo(patientAchievementInfo));
    return "EmailConfirmation";
  } else {
    // Failed - bad barcode or record doesn't exist
    return "BarcodeContactSupport";
  }
}

export async function getBarcodeConnectionErrorNextScreen() {
  const store = await getStore();
  const state: StoreState = store.getState();

  if (!state.meta.isConnected) {
    Alert.alert(
      i18n.t("common:notifications:connectionErrorTitle"),
      i18n.t("common:notifications:connectionError", getDevice())
    );
    return "BarcodeConnectionToServerError";
  }

  return getBarcodeNextScreen();
}

async function getPatientAchievementInfo(
  barcode: string,
  id: string,
  secret: string,
  demo: boolean
): Promise<PatientAchievementInfo> {
  try {
    const response = await axios.post(
      getApiBaseUrl() + "/chills/matchBarcode",
      {
        barcode,
        id,
        secret,
        demo,
      }
    );
    if (!!response.data) {
      return response.data;
    }
  } catch (error) {
    logFirebaseEvent(AppHealthEvents.MATCH_BARCODE_ERROR, {
      error: JSON.stringify(error),
    });
  }
  return {
    email: "",
    emailHash: "",
    emailSalt: "",
    city: "",
    state: "",
  };
}

const FILLER_CHAR = "/*";

export async function getEmailConfirmationTextVariables() {
  const state: StoreState = (await getStore()).getState();
  const { email } = state.meta.patientAchievementInfo;
  const emailHint = email.split("*").join(FILLER_CHAR);
  return {
    barcode: state.survey.kitBarcode && state.survey.kitBarcode.code,
    emailHint,
    enteredEmail: state.meta.enteredEmail,
  };
}

export async function getEmailConfirmationNextScreen() {
  const state: StoreState = (await getStore()).getState();
  const hash = await NativeModules.Aes.pbkdf2(
    state.meta.enteredEmail,
    state.meta.patientAchievementInfo.emailSalt,
    10000,
    512
  );

  const serverHash = base64url.toBuffer(
    base64url.fromBase64(state.meta.patientAchievementInfo.emailHash)
  );
  const localHash = new Buffer(hash, "hex");
  return serverHash.equals(localHash) ? "Unpacking" : "EmailError";
}

export async function getShippingTextVariables() {
  const state: StoreState = (await getStore()).getState();
  return {
    state: state.meta.patientAchievementInfo.state
      .toLowerCase()
      .replace(" ", "-"),
    city: state.meta.patientAchievementInfo.city
      .toLowerCase()
      .replace(" ", "-"),
  };
}

export async function getThankYouTextVariables() {
  const state: StoreState = (await getStore()).getState();
  return {
    state: state.meta.patientAchievementInfo.state
      .toLowerCase()
      .replace(" ", "+"),
    city: state.meta.patientAchievementInfo.city
      .toLowerCase()
      .replace(" ", "+"),
  };
}
