// Copyright (c) 2019 by Audere
//
// Use of this source code is governed by an MIT-style license that
// can be found in the LICENSE file distributed with this file.

"use strict";

const { baseColumns, column } = require("../../util");
const schema = "chills";

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.createTable(
      "cdc_clinical",
      {
        ...baseColumns(Sequelize),
        state: column(Sequelize.STRING),
        year: column(Sequelize.INTEGER),
        week: column(Sequelize.INTEGER),
        total_specimens: column(Sequelize.INTEGER),
        total_a: column(Sequelize.INTEGER),
        total_b: column(Sequelize.INTEGER)
      },
      { schema }
    );

    await queryInterface.addConstraint(
      { tableName: "cdc_clinical", schema },
      ["state", "year", "week"],
      {
        type: "unique",
        name: "cdc_clinical_unique_idx"
      },
      { schema }
    );

    await queryInterface.createTable(
      "cdc_ilinet",
      {
        ...baseColumns(Sequelize),
        state: column(Sequelize.STRING),
        year: column(Sequelize.INTEGER),
        week: column(Sequelize.INTEGER),
        total_ili: column(Sequelize.INTEGER),
        providers: column(Sequelize.INTEGER),
        total_patients: column(Sequelize.INTEGER)
      },
      { schema }
    );

    await queryInterface.addConstraint(
      { tableName: "cdc_ilinet", schema },
      ["state", "year", "week"],
      {
        type: "unique",
        name: "cdc_ilinet_unique_idx"
      },
      { schema }
    );
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.removeConstraint("cdc_clinical", "cdc_clinical_unique_idx", { schema });
    await queryInterface.dropTable("cdc_clinical", { schema });
    await queryInterface.removeConstraint("cdc_ilinet", "cdc_ilinet_unique_idx", { schema });
    await queryInterface.dropTable("cdc_ilinet", { schema });
  }
};
