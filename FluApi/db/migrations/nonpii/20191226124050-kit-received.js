// Copyright (c) 2019 by Audere
//
// Use of this source code is governed by an MIT-style license that
// can be found in the LICENSE file distributed with this file.

const { column, nullableColumn } = require("../../util");
const schema = "chills";

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.renameColumn(
      {
        tableName: "mtl_reports",
        schema: schema
      },
      "received",
      "processing"
    );

    await queryInterface.addColumn(
      {
        tableName: "mtl_reports",
        schema: schema
      },
      "received",
      {
        ...column(Sequelize.BOOLEAN),
        defaultValue: false
      }
    );

    await queryInterface.addColumn(
      {
        tableName: "mtl_reports",
        schema: schema
      },
      "received_timestamp",
      { ...nullableColumn(Sequelize.STRING) }
    );
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.removeColumn(
      {
        tableName: "mtl_reports",
        schema: schema
      },
      "received"
    );

    await queryInterface.removeColumn(
      {
        tableName: "mtl_reports",
        schema: schema
      },
      "received_timestamp"
    );

    await queryInterface.renameColumn(
      {
        tableName: "mtl_reports",
        schema: schema
      },
      "processing",
      "received"
    );
  }
};