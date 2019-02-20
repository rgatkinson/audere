"use strict";
// Copyright (c) 2018 by Audere
//
// Use of this source code is governed by an MIT-style license that
// can be found in the LICENSE file distributed with this file.
exports.__esModule = true;
var DocumentType;
(function (DocumentType) {
    DocumentType["Survey"] = "SURVEY";
    DocumentType["Feedback"] = "FEEDBACK";
    DocumentType["Log"] = "LOG";
    DocumentType["Analytics"] = "ANALYTICS";
})(DocumentType = exports.DocumentType || (exports.DocumentType = {}));
// The following options come from:
// https://www.hl7.org/fhir/valueset-administrative-gender.html
var PatientInfoGender;
(function (PatientInfoGender) {
    PatientInfoGender["Male"] = "male";
    PatientInfoGender["Female"] = "female";
    PatientInfoGender["Other"] = "other";
    PatientInfoGender["Unknown"] = "unknown";
})(PatientInfoGender = exports.PatientInfoGender || (exports.PatientInfoGender = {}));
var TelecomInfoSystem;
(function (TelecomInfoSystem) {
    TelecomInfoSystem["Phone"] = "phone";
    TelecomInfoSystem["SMS"] = "sms";
    TelecomInfoSystem["Email"] = "email";
})(TelecomInfoSystem = exports.TelecomInfoSystem || (exports.TelecomInfoSystem = {}));
var AddressInfoUse;
(function (AddressInfoUse) {
    AddressInfoUse["Home"] = "home";
    AddressInfoUse["Work"] = "work";
    AddressInfoUse["Temp"] = "temp";
})(AddressInfoUse = exports.AddressInfoUse || (exports.AddressInfoUse = {}));
var ConsentInfoSignerType;
(function (ConsentInfoSignerType) {
    ConsentInfoSignerType["Subject"] = "Subject";
    ConsentInfoSignerType["Parent"] = "Parent";
    ConsentInfoSignerType["Representative"] = "Representative";
    ConsentInfoSignerType["Researcher"] = "Researcher";
})(ConsentInfoSignerType = exports.ConsentInfoSignerType || (exports.ConsentInfoSignerType = {}));
var LogLevel;
(function (LogLevel) {
    LogLevel[LogLevel["Info"] = 1] = "Info";
    LogLevel[LogLevel["Warn"] = 2] = "Warn";
    LogLevel[LogLevel["Error"] = 3] = "Error";
    LogLevel[LogLevel["Fatal"] = 4] = "Fatal";
})(LogLevel = exports.LogLevel || (exports.LogLevel = {}));
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
})(EventInfoKind = exports.EventInfoKind || (exports.EventInfoKind = {}));
