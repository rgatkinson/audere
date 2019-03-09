"use strict";
// Copyright (c) 2018 Audere
//
// Permission is hereby granted, free of charge, to any person obtaining a copy
// of this software and associated documentation files (the "Software"), to deal
// in the Software without restriction, including without limitation the rights
// to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
// copies of the Software, and to permit persons to whom the Software is
// furnished to do so, subject to the following conditions:
//
// The above copyright notice and this permission notice shall be included in all
// copies or substantial portions of the Software.
//
// THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
// IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
// FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
// AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
// LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
// OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
// SOFTWARE.
exports.__esModule = true;
// Any changes to the Encounter interface should increment the schema version.
//
// MAJOR.MINOR.PATCH
//
// MAJOR should increment when there is an incompatible or breaking change.
// MINOR should increment when fields are added in a backwards compatible way.
// PATCH should increment when there is a backward-compatible bug fix.
exports.schemaVersion = "1.0.0";
var LocationType;
(function (LocationType) {
    LocationType["Home"] = "Home";
    LocationType["Work"] = "Work";
    LocationType["Temp"] = "Temp";
})(LocationType = exports.LocationType || (exports.LocationType = {}));
var SampleType;
(function (SampleType) {
    SampleType["SelfSwab"] = "SelfSwab";
    SampleType["ClinicSwab"] = "ClinicSwab";
    SampleType["Blood"] = "Blood";
    SampleType["Serum"] = "Serum";
    SampleType["PBMC"] = "PBMC";
})(SampleType = exports.SampleType || (exports.SampleType = {}));
