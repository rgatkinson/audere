var config = require("./jest.config");
config.testPathIgnorePatterns = ["\\.snap$", "<rootDir>/node_modules/"]; //Overriding testRegex option
config.testMatch = ["**/(appium.*).(ts|js)?(x)"];
module.exports = config;
