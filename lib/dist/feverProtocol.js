"use strict";
// Copyright (c) 2018 by Audere
//
// Use of this source code is governed by an MIT-style license that
// can be found in the LICENSE file distributed with this file.
exports.__esModule = true;
// ========================================================================
//
// PLEASE NOTE:
//
// If you need to change types here sometime after we store real data:
// Because these types are used across client/server, we have to maintain
// compatibility.  The two ways of doing this are:
//   1) Add a new optional field.
//   2) Bump the top-level schemaId, and create a new version of each
//      container type from the modified type up to the root of the
//      containment tree.
//
// ========================================================================
var common = require("./common");
exports.PatientInfoGender = common.PatientInfoGender;
exports.TelecomInfoSystem = common.TelecomInfoSystem;
exports.AddressInfoUse = common.AddressInfoUse;
exports.ConsentInfoSignerType = common.ConsentInfoSignerType;
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
