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
