import { getStore, setPatientAchievementInfo, StoreState } from "../store";
import { PatientAchievementInfo } from "../store/meta";

export async function getBarcodeNextScreen() {
  const store = await getStore();
  const state: StoreState = store.getState();
  if (!state.survey.kitBarcode) {
    return "BarcodeContactSupport";
  }
  const patientAchievementInfo = await getPatientAchievementInfo(
    state.survey.kitBarcode.code
  );
  if (patientAchievementInfo) {
    // Success - barcode matches with Achievement record
    store.dispatch(setPatientAchievementInfo(patientAchievementInfo));
    return "EmailConfirmation";
  } else {
    // Failed - bad barcode or record doesn't exist
    return "BarcodeContactSupport";
  }
}

async function getPatientAchievementInfo(
  barcode: string
): Promise<PatientAchievementInfo> {
  //TODO: hook up to server API
  return { actualEmail: "philip@auderenow.org", state: "wa", zipCode: 98040 };
}

const FILLER_CHAR = "/*";

export async function getEmailConfirmationTextVariables() {
  const state: StoreState = (await getStore()).getState();
  let emailHint;
  const { actualEmail } = state.meta.patientAchievementInfo;
  const atIndex = actualEmail.indexOf("@");
  if (atIndex > 0) {
    const start = atIndex > 1 ? actualEmail[0] : FILLER_CHAR;
    const middle = atIndex > 2 ? FILLER_CHAR.repeat(atIndex - 2) : "";
    const end =
      atIndex > 3 ? actualEmail[atIndex - 1] : atIndex > 1 ? FILLER_CHAR : "";
    emailHint = start + middle + end + actualEmail.substring(atIndex);
  }
  return {
    barcode: state.survey.kitBarcode && state.survey.kitBarcode.code,
    emailHint,
    enteredEmail: state.meta.enteredEmail,
  };
}

export async function getEmailConfirmationNextScreen() {
  const state: StoreState = (await getStore()).getState();
  return state.meta.patientAchievementInfo.actualEmail ===
    state.meta.enteredEmail
    ? "Unpacking"
    : "EmailError";
}

export async function getShippingTextVariables() {
  const state: StoreState = (await getStore()).getState();
  return {
    state: state.meta.patientAchievementInfo.state,
  };
}
