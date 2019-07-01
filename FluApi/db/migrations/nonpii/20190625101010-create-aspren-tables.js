// Copyright (c) 2019 by Audere
//
// Use of this source code is governed by an MIT-style license that
// can be found in the LICENSE file distributed with this file.

"use strict";

const { baseColumns, column, nullableColumn, unique } = require("../../util");
const schema = "cough";

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.createTable(
      "aspren_files",
      {
        ...baseColumns(Sequelize),
        key: unique(column(Sequelize.STRING)),
        hash: column(Sequelize.STRING)
      },
      { schema }
    );

    await queryInterface.createTable(
      "aspren_data",
      {
        ...baseColumns(Sequelize),
        barcode: unique(column(Sequelize.STRING)),
        encounter_date: column(Sequelize.STRING),
        encounter_state: column(Sequelize.STRING),
        adeno_result: column(Sequelize.BOOLEAN),
        b_pertussis_result: column(Sequelize.BOOLEAN),
        flu_a_result: column(Sequelize.BOOLEAN),
        flu_b_result: column(Sequelize.BOOLEAN),
        h1n1_result: column(Sequelize.BOOLEAN),
        h3n2_result: column(Sequelize.BOOLEAN),
        metapneumovirus_result: column(Sequelize.BOOLEAN),
        mycopneumonia_result: column(Sequelize.BOOLEAN),
        para_1_result: column(Sequelize.BOOLEAN),
        para_2_result: column(Sequelize.BOOLEAN),
        para_3_result: column(Sequelize.BOOLEAN),
        rhinovirus_result: column(Sequelize.BOOLEAN),
        rsv_result: column(Sequelize.BOOLEAN),
        victoria_result: column(Sequelize.BOOLEAN),
        yamagata_result: column(Sequelize.BOOLEAN),
        atsi: nullableColumn(Sequelize.ENUM("AB", "TS", "BT", "U", "N")),
        date_onset: column(Sequelize.STRING),
        current_vaccination: nullableColumn(Sequelize.ENUM("Y", "N", "U")),
        vaccination_date: nullableColumn(Sequelize.STRING),
        previous_vaccination: nullableColumn(
          Sequelize.ENUM("Y", "N", "U", "NEVER")
        ),
        comorbities: nullableColumn(Sequelize.BOOLEAN),
        comorbities_description: nullableColumn(Sequelize.STRING),
        hcw_status: nullableColumn(Sequelize.BOOLEAN),
        overseas_illness: nullableColumn(Sequelize.BOOLEAN),
        overseas_location: nullableColumn(Sequelize.STRING)
      },
      { schema }
    );
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.dropTable("aspren_files", { schema });
    await queryInterface.dropTable("aspren_data", { schema });
  }
};
