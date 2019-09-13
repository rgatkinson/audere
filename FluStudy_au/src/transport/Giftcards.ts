import {
  GiftcardRequest,
  GiftcardResponse,
  GiftcardFailureReason,
  GiftcardAvailabilityResponse,
} from "audere-lib/coughProtocol";
import axios from "axios";
import Constants from "expo-constants";
import { getApiBaseUrl } from "./index";
import { reportError } from "../util/tracker";
import { createAccessKey } from "../util/accessKey";

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
  const giftcardRequest = createGiftcardRequest(barcode, denomination, isDemo);
  try {
    const response = await axios.get(`${getApiBaseUrl()}/api/giftcard`, {
      params: { giftcardRequest },
    });
    return response.data;
  } catch (e) {
    reportError(e);
    return {
      failureReason: GiftcardFailureReason.API_ERROR,
    };
  }
}

export async function checkGiftcardAvailability(
  barcode: string,
  denomination: number,
  isDemo: boolean
): Promise<GiftcardAvailabilityResponse> {
  if (process.env.DEBUG_GIFTCARD) {
    return {
      giftcardAvailable: true,
    };
  }
  if (process.env.DEBUG_GIFTCARD_ERROR) {
    return {
      giftcardAvailable: false,
      failureReason: parseInt(process.env.DEBUG_GIFTCARD_ERROR),
    };
  }
  const giftcardRequest = createGiftcardRequest(barcode, denomination, isDemo);
  let response;
  try {
    const response = await axios.get(
      `${getApiBaseUrl()}/api/giftcardAvailable`,
      {
        params: { giftcardRequest },
      }
    );
    return response.data;
  } catch (e) {
    reportError(e);
    return {
      giftcardAvailable: false,
      failureReason: GiftcardFailureReason.API_ERROR,
    };
  }
}

function createGiftcardRequest(
  barcode: string,
  denomination: number,
  isDemo: boolean
): GiftcardRequest {
  const installationId = Constants.installationId;
  return {
    installationId,
    barcode,
    denomination,
    isDemo,
    secret: createAccessKey(),
  };
}
