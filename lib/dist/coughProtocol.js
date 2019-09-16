"use strict";
// Copyright (c) 2018 by Audere
//
// Use of this source code is governed by an MIT-style license that
// can be found in the LICENSE file distributed with this file.
exports.__esModule = true;
var common_1 = require("./common");
exports.PatientInfoGender = common_1.PatientInfoGender;
var DocumentType;
(function (DocumentType) {
    DocumentType["Survey"] = "SURVEY";
    DocumentType["Photo"] = "PHOTO";
})(DocumentType = exports.DocumentType || (exports.DocumentType = {}));
var EventInfoKind;
(function (EventInfoKind) {
    EventInfoKind["AppNav"] = "appNav";
    EventInfoKind["TimeoutNav"] = "timeoutNav";
    EventInfoKind["Render"] = "render";
})(EventInfoKind = exports.EventInfoKind || (exports.EventInfoKind = {}));
// Must be kept in sync with native RDTReader/ImageProcessor.h
var RDTReaderExposureResult;
(function (RDTReaderExposureResult) {
    RDTReaderExposureResult[RDTReaderExposureResult["UNDER_EXPOSED"] = 0] = "UNDER_EXPOSED";
    RDTReaderExposureResult[RDTReaderExposureResult["NORMAL"] = 1] = "NORMAL";
    RDTReaderExposureResult[RDTReaderExposureResult["OVER_EXPOSED"] = 2] = "OVER_EXPOSED";
})(RDTReaderExposureResult = exports.RDTReaderExposureResult || (exports.RDTReaderExposureResult = {}));
// Must be kept in sync with native RDTReader/ImageProcessor.h
var RDTReaderSizeResult;
(function (RDTReaderSizeResult) {
    RDTReaderSizeResult[RDTReaderSizeResult["RIGHT_SIZE"] = 0] = "RIGHT_SIZE";
    RDTReaderSizeResult[RDTReaderSizeResult["LARGE"] = 1] = "LARGE";
    RDTReaderSizeResult[RDTReaderSizeResult["SMALL"] = 2] = "SMALL";
    RDTReaderSizeResult[RDTReaderSizeResult["INVALID"] = 3] = "INVALID";
})(RDTReaderSizeResult = exports.RDTReaderSizeResult || (exports.RDTReaderSizeResult = {}));
var GiftcardFailureReason;
(function (GiftcardFailureReason) {
    GiftcardFailureReason[GiftcardFailureReason["CARDS_EXHAUSTED"] = 0] = "CARDS_EXHAUSTED";
    GiftcardFailureReason[GiftcardFailureReason["INVALID_DOC_ID"] = 1] = "INVALID_DOC_ID";
    GiftcardFailureReason[GiftcardFailureReason["INVALID_BARCODE"] = 2] = "INVALID_BARCODE";
    GiftcardFailureReason[GiftcardFailureReason["API_ERROR"] = 3] = "API_ERROR";
})(GiftcardFailureReason = exports.GiftcardFailureReason || (exports.GiftcardFailureReason = {}));
