import { getStore, StoreState } from "../store";

export async function getGeneralExposureTextVariables() {
  const state: StoreState = (await getStore()).getState();
  //TBD - we'll need something like state.survey.state
  return { state: "WA" };
}
