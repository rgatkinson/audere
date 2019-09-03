"use strict";
// Copyright (c) 2019 by Audere
//
// Use of this source code is governed by an MIT-style license that
// can be found in the LICENSE file distributed with this file.
exports.__esModule = true;
var DocumentType;
(function (DocumentType) {
    DocumentType["Encounter"] = "ENCOUNTER";
    DocumentType["Triage"] = "TRIAGE";
    DocumentType["MessagingToken"] = "MESSAGING_TOKEN";
    DocumentType["Notification"] = "NOTIFICATION";
})(DocumentType = exports.DocumentType || (exports.DocumentType = {}));
var ConditionTag;
(function (ConditionTag) {
    ConditionTag["Ebola"] = "EBOLA";
})(ConditionTag = exports.ConditionTag || (exports.ConditionTag = {}));
var NotificationType;
(function (NotificationType) {
    NotificationType["Chat"] = "CHAT";
    NotificationType["Diagnosis"] = "DIAGNOSIS";
})(NotificationType = exports.NotificationType || (exports.NotificationType = {}));
