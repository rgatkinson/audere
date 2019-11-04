// Copyright (c) 2019 by Audere
//
// Use of this source code is governed by an MIT-style license that
// can be found in the LICENSE file distributed with this file.

"use strict";

const { baseColumns, column, unique } = require("../../util");
const schema = "chills";

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.createTable(
      "firebase_analytics",
      {
        ...baseColumns(Sequelize),
        event_date: column(Sequelize.STRING),
        event: column(Sequelize.JSONB)
      },
      { schema }
    );

    await queryInterface.createTable(
      "firebase_analytics_table",
      {
        ...baseColumns(Sequelize),
        name: unique(column(Sequelize.STRING)),
        modified: column(Sequelize.BIGINT)
      },
      { schema }
    );
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.dropTable("firebase_analytics", { schema });
    await queryInterface.dropTable("firebase_analytics_table", { schema });
  }
};
