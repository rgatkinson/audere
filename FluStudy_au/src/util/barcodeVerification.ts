// Copyright (c) 2019 by Audere
//
// Use of this source code is governed by an MIT-style license that
// can be found in the LICENSE file distributed with this file.

import { Alert } from "react-native";
import i18n from "i18next";
import axios from "axios";
import { getApiBaseUrl } from "../transport";
import { getRemoteConfig } from "./remoteConfig";
import { tracker, BarcodeVerificationEvents } from "./tracker";

const BARCODE_RE = /^[0-9a-f]{8}$/;
const BARCODE_CHARS = 8;

export function validBarcodeShape(barcode: string): boolean {
  return (
    barcode != null &&
    BARCODE_RE.test(barcode) &&
    barcode.length == BARCODE_CHARS
  );
}

export function invalidBarcodeShapeAlert(
  barcode: string,
  onPress: () => void = () => {}
): void {
  Alert.alert(
    i18n.t("barcode:sorry"),
    i18n.t("barcode:invalidBarcode", { barcode }),
    [
      {
        text: i18n.t("common:button:ok"),
        onPress,
      },
    ]
  );
}

export async function verifiedBarcode(barcode: string): Promise<boolean> {
  const validateBarcodes = getRemoteConfig("validateBarcodes");
  if (!validateBarcodes) {
    return true;
  }
  let response;
  try {
    response = await axios.get(getApiBaseUrl() + "/validateBarcode/" + barcode);
    if (response != null) {
      tracker.logEvent(BarcodeVerificationEvents.SERVER_RESPONSE, {
        barcode,
        responseStatus: response.status,
        responseData: response.data,
      });
      return response.status === 200 && response.data === "Valid";
    }
  } catch (e) {
    tracker.logEvent(BarcodeVerificationEvents.EXCEPTION, { barcode });
  }
  return false;
}

export function verifiedSupportCode(code: string): boolean {
  const validateSupportCodes = getRemoteConfig("validateSupportCodes");
  if (!validateSupportCodes) {
    return true;
  }
  const supportCodes = getRemoteConfig("barcodeSupportCodes");

  if (supportCodes.includes(code)) {
    tracker.logEvent(BarcodeVerificationEvents.VALID_SUPPORT_CODE, { code });
    return true;
  } else {
    tracker.logEvent(BarcodeVerificationEvents.INVALID_SUPPORT_CODE, {
      code,
      supportCodes,
    });
    return false;
  }
}

export function unverifiedBarcodeAlert(
  action: string,
  onPress: () => void = () => {}
): void {
  Alert.alert(
    i18n.t("barcode:notVerified"),
    i18n.t("barcode:pleaseRetry", { action }),
    [
      {
        text: i18n.t("barcode:tryAgain"),
        onPress,
      },
    ]
  );
}
