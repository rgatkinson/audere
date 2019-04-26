"use strict";

module.exports = {
  up: (queryInterface, Sequelize) => {
    return queryInterface.addConstraint("device_settings", ["device", "key"], {
      name: "device_key_unique",
      type: "UNIQUE"
    });
  },

  down: (queryInterface, Sequelize) => {
    return queryInterface.removeConstraint(
      "device_settings",
      "device_key_unique"
    );
  }
};
