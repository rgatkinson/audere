// Copyright (c) 2019 by Audere
//
// Use of this source code is governed by an MIT-style license that
// can be found in the LICENSE file distributed with this file.

import { Alert } from "react-native";
import i18n from "i18next";
import axios from "axios";
import { getApiBaseUrl } from "../transport";
import { getRemoteConfig } from "./remoteConfig";

const BARCODE_RE = /^[0-9]{8}$/;
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
