"use strict";
// Copyright (c) 2018 by Audere
//
// Use of this source code is governed by an MIT-style license that
// can be found in the LICENSE file distributed with this file.
exports.__esModule = true;
var DocumentType;
(function (DocumentType) {
    DocumentType["Visit"] = "VISIT";
    DocumentType["VisitCore"] = "VISIT_CORE";
    DocumentType["VisitIdentity"] = "VISIT_IDENTITY";
    DocumentType["Feedback"] = "FEEDBACK";
    DocumentType["Log"] = "LOG";
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
})(AddressInfoUse = exports.AddressInfoUse || (exports.AddressInfoUse = {}));
var ConsentInfoSignerType;
(function (ConsentInfoSignerType) {
    ConsentInfoSignerType["Subject"] = "Subject";
    ConsentInfoSignerType["Parent"] = "Parent";
    ConsentInfoSignerType["Representative"] = "Representative";
})(ConsentInfoSignerType = exports.ConsentInfoSignerType || (exports.ConsentInfoSignerType = {}));
var EventInfoKind;
(function (EventInfoKind) {
    EventInfoKind["Visit"] = "visit";
    EventInfoKind["Response"] = "response";
    EventInfoKind["Sample"] = "sample";
})(EventInfoKind = exports.EventInfoKind || (exports.EventInfoKind = {}));
