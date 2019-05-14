// Copyright (c) 2019 by Audere
//
// Use of this source code is governed by an MIT-style license that
// can be found in the LICENSE file distributed with this file.

"use strict";

const { baseColumns, column, unique } = require("../../util");

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.createTable("cough_access_keys", {
      ...baseColumns(Sequelize),
      key: column(Sequelize.STRING),
      valid: column(Sequelize.BOOLEAN)
    });
    await queryInterface.createTable("cough_current_surveys", {
      ...baseColumns(Sequelize),
      docid: unique(column(Sequelize.STRING)),
      device: column(Sequelize.JSONB),
      survey: column(Sequelize.JSONB)
    });
    await queryInterface.createTable("cough_backup_surveys", {
      ...baseColumns(Sequelize),
      docid: unique(column(Sequelize.STRING)),
      device: column(Sequelize.JSONB),
      survey: column(Sequelize.JSONB)
    });
    await queryInterface.createTable("cough_photos", {
      ...baseColumns(Sequelize),
      guid: unique(column(Sequelize.STRING)),
      device: column(Sequelize.JSONB),
      photo: column(Sequelize.JSONB)
    });
  },

  down: async (queryInterface, Sequelize) => {
    return Promise.all(
      [
        "cough_access_keys",
        "cough_current_surveys",
        "cough_backup_surveys",
        "cough_photos"
      ].map(name => queryInterface.dropTable(name))
    );
  }
};
