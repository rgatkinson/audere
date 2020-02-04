// Copyright (c) 2020 by Audere
//
// Use of this source code is governed by an MIT-style license that
// can be found in the LICENSE file distributed with this file.

"use strict";

const { baseColumns, column, unique } = require("../../util");
const schema = "chills";

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.createTable(
      "evidation_triggers",
      {
        ...baseColumns(Sequelize),
        evidation_id: unique(column(Sequelize.STRING)),
        trigger_date: column(Sequelize.STRING),
      },
      { schema }
    );
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.dropTable("evidation_triggers", { schema });
  },
}