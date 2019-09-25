import { getRemoteConfig } from "./remoteConfig";
import { getStore } from "../store";

export function getWelcomeText() {
  return getRemoteConfig("giftCardsAvailable") ? "descGiftCard" : "desc";
}

export function getParticipantInfoText() {
  return getRemoteConfig("giftCardsAvailable") ? "desc2Incentive" : "desc2";
}

export function getAppSupportText() {
  return getRemoteConfig("giftCardsAvailable")
    ? "appSupportGiftCardsDesc"
    : "appSupportDesc";
}

export async function getGiftCardAmount() {
  const state = (await getStore()).getState();
  if (!state.survey.giftCardInfo || !state.survey.giftCardInfo.giftCardAmount) {
    return { giftCardAmount: getRemoteConfig("giftCardAmount") };
  }
  return { giftCardAmount: state.survey.giftCardInfo.giftCardAmount };
}
