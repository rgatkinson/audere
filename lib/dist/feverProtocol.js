"use strict";
// Copyright (c) 2018 by Audere
//
// Use of this source code is governed by an MIT-style license that
// can be found in the LICENSE file distributed with this file.
exports.__esModule = true;
var common_1 = require("./common");
exports.PatientInfoGender = common_1.PatientInfoGender;
exports.TelecomInfoSystem = common_1.TelecomInfoSystem;
exports.AddressInfoUse = common_1.AddressInfoUse;
exports.ConsentInfoSignerType = common_1.ConsentInfoSignerType;
var DocumentType;
(function (DocumentType) {
    DocumentType["Survey"] = "SURVEY";
    DocumentType["Feedback"] = "FEEDBACK";
    DocumentType["Analytics"] = "ANALYTICS";
    DocumentType["Photo"] = "PHOTO";
})(DocumentType = exports.DocumentType || (exports.DocumentType = {}));
var LogRecordLevel;
(function (LogRecordLevel) {
    LogRecordLevel["Debug"] = "DEBUG";
    LogRecordLevel["Info"] = "INFO";
    LogRecordLevel["Warn"] = "WARN";
    LogRecordLevel["Error"] = "ERROR";
    LogRecordLevel["Fatal"] = "FATAL";
})(LogRecordLevel = exports.LogRecordLevel || (exports.LogRecordLevel = {}));
var EventInfoKind;
(function (EventInfoKind) {
    EventInfoKind["Response"] = "response";
    EventInfoKind["Sample"] = "sample";
    EventInfoKind["Screening"] = "screening";
    EventInfoKind["Survey"] = "survey";
    EventInfoKind["AppNav"] = "appNav";
    EventInfoKind["TimeoutNav"] = "timeoutNav";
    EventInfoKind["Interaction"] = "interaction";
    EventInfoKind["Render"] = "render";
})(EventInfoKind = exports.EventInfoKind || (exports.EventInfoKind = {}));
