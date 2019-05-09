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
    DocumentType["Visit"] = "VISIT";
    DocumentType["Feedback"] = "FEEDBACK";
    DocumentType["Log"] = "LOG";
    DocumentType["LogBatch"] = "LOG_BATCH";
    DocumentType["Backup"] = "BACKUP";
})(DocumentType = exports.DocumentType || (exports.DocumentType = {}));
var EventInfoKind;
(function (EventInfoKind) {
    EventInfoKind["Visit"] = "visit";
    EventInfoKind["Response"] = "response";
    EventInfoKind["Sample"] = "sample";
})(EventInfoKind = exports.EventInfoKind || (exports.EventInfoKind = {}));
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
