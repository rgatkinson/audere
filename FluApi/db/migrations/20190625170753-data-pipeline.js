// Copyright (c) 2019 by Audere
//
// Use of this source code is governed by an MIT-style license that
// can be found in the LICENSE file distributed with this file.

"use strict";

const { baseColumns, column, unique } = require("../util");

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.createTable(
      "data_pipeline_nodes",
      {
        ...baseColumns(Sequelize),
        name: unique(column(Sequelize.STRING)),
        hash: column(Sequelize.STRING),
        cleanup: column(Sequelize.TEXT),
      }
    );
  },

  down: async (queryInterface, Sequelize) => {
    await querInterface.dropTable("data_pipeline_nodes");
  }
};
