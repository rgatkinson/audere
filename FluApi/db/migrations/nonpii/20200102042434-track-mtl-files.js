// Copyright (c) 2019 by Audere
//
// Use of this source code is governed by an MIT-style license that
// can be found in the LICENSE file distributed with this file.

const { nullableColumn } = require("../../util");
const schema = "chills";

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.addColumn(
      {
        tableName: "mtl_files",
        schema: schema
      },
      "order_id",
      { ...nullableColumn(Sequelize.STRING) }
    );

    await queryInterface.addColumn(
      {
        tableName: "mtl_files",
        schema: schema
      },
      "order_state",
      { ...nullableColumn(Sequelize.STRING) }
    );
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.removeColumn(
      {
        tableName: "mtl_files",
        schema: schema
      },
      "order_id"
    );

    await queryInterface.removeColumn(
      {
        tableName: "mtl_files",
        schema: schema
      },
      "order_state"
    );
  }
};
