// Copyright (c) 2019 by Audere
//
// Use of this source code is governed by an MIT-style license that
// can be found in the LICENSE file distributed with this file.

var config = require("./jest.config");
config.testPathIgnorePatterns = ["\\.snap$", "<rootDir>/node_modules/"]; //Overriding testRegex option
config.testMatch = ["**/(appium.*).(ts|js)?(x)"];
module.exports = config;
