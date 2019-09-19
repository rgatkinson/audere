// Copyright (c) 2019 by Audere
//
// Use of this source code is governed by an MIT-style license that
// can be found in the LICENSE file distributed with this file.

'use strict';

const { baseColumns, column, foreignIdKey, nullableColumn, unique } = require("../../util");

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.createTable(
      "config",
      {
        ...baseColumns(Sequelize),
        project: column(Sequelize.STRING),
        key: column(Sequelize.STRING),
        value: column(Sequelize.JSONB),
      },
    );
    await queryInterface.addConstraint("config", ["project", "key"], {
      type: "unique",
      name: "config_unique_project_key",
    });
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.dropTable("config");
  }
};
