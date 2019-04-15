// Copyright (c) 2019 by Audere
//
// Use of this source code is governed by an MIT-style license that
// can be found in the LICENSE file distributed with this file.

"use strict";

const {
  column,
  identity,
} = require("../../util");

module.exports = {
  up: (queryInterface, Sequelize) => {
    return queryInterface.createTable("device_settings", {
      id: identity(column(Sequelize.INTEGER)),
      createdAt: column(Sequelize.DATE),
      updatedAt: column(Sequelize.DATE),
      device: column(Sequelize.STRING),
      key: column(Sequelize.STRING),
      setting: column(Sequelize.TEXT),
    });
  },

  down: (queryInterface, Sequelize) => {
    return queryInterface.dropTable("device_settings");
  }
};
