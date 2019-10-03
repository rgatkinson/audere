import { getStore, StoreState } from "../store";

export async function getShippingTextVariables() {
  const state: StoreState = (await getStore()).getState();
  //TBD - we'll need something like state.survey.zipcode
  return { zipcode: "98040" };
}
