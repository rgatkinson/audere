// Copyright (c) 2019 by Audere
//
// Use of this source code is governed by an MIT-style license that
// can be found in the LICENSE file distributed with this file.

"use strict";

const { baseColumns, column, nullableColumn, unique } = require("../../util");
const schema = "chills";

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.createTable(
      "virena_files",
      {
        ...baseColumns(Sequelize),
        key: unique(column(Sequelize.STRING)),
        hash: column(Sequelize.STRING),
        loaded: column(Sequelize.BOOLEAN),
        next_row: nullableColumn(Sequelize.INTEGER)
      },
      { schema }
    );

    await queryInterface.createTable(
      "virena_records",
      {
        ...baseColumns(Sequelize),
        file_id: {
          allowNull: false,
          unique: false,
          type: Sequelize.INTEGER,
          references: {
            model: {
              tableName: "virena_files",
              schema: schema,
            },
            key: "id",
          },
          onDelete: "CASCADE"
        },
        serial_number: column(Sequelize.STRING),
        test_date: column(Sequelize.STRING),
        facility: column(Sequelize.STRING),
        city: column(Sequelize.STRING),
        state: column(Sequelize.STRING),
        zip: column(Sequelize.STRING),
        patient_age: column(Sequelize.STRING),
        result1: nullableColumn(Sequelize.BOOLEAN),
        result2: nullableColumn(Sequelize.BOOLEAN),
        overall_result: nullableColumn(Sequelize.BOOLEAN),
        county: column(Sequelize.STRING),
        facility_description: column(Sequelize.STRING)
      },
      { schema }
    );
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.dropTable("virena_files", { schema });
    await queryInterface.dropTable("virena_records", { schema });
  }
};
