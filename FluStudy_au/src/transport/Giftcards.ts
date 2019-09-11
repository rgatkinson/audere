import {
  GiftcardRequest,
  GiftcardResponse,
  GiftcardFailureReason,
} from "audere-lib/coughProtocol";
import axios from "axios";
import Constants from "expo-constants";
import { getApiBaseUrl } from "./index";
import { reportError } from "../util/tracker";

export async function getGiftcard(
  barcode: string,
  denomination: number,
  isDemo: boolean
): Promise<GiftcardResponse> {
  if (process.env.DEBUG_GIFTCARD) {
    return {
      giftcard: {
        url: "https://www.auderenow.org/",
        denomination,
        isDemo,
        isNew: true,
      },
    };
  }
  if (process.env.DEBUG_GIFTCARD_ERROR) {
    return {
      failureReason: parseInt(process.env.DEBUG_GIFTCARD_ERROR),
    };
  }
  if (!process.env.GIFTCARD_KEY) {
    throw new Error("GIFTCARD_KEY not configured");
  }
  const installationId = Constants.installationId;
  const giftcardRequest: GiftcardRequest = {
    installationId,
    barcode,
    denomination,
    isDemo,
    secret: process.env.GIFTCARD_KEY,
  };
  let response;
  try {
    response = await axios.get(`${getApiBaseUrl()}/api/giftcard`, {
      params: { giftcardRequest },
    });
  } catch (e) {
    reportError(e);
    return {
      failureReason: GiftcardFailureReason.API_ERROR,
    };
  }
  return response.data;
}
