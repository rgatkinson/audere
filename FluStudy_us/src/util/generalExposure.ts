import { getStore, StoreState } from "../store";

export async function getGeneralExposureTextVariables() {
  const state: StoreState = (await getStore()).getState();
  return { state: state.meta.patientAchievementInfo.state };
}
