// Copyright (c) 2019 by Audere
//
// Use of this source code is governed by an MIT-style license that
// can be found in the LICENSE file distributed with this file.

'use strict';

const { baseColumns, column, foreignIdKey, nullableColumn, unique } = require("../../util");
const schema = "cough";

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.createTable(
      "giftcard_rate_limit",
      {
        ...baseColumns(Sequelize),
        limit: column(Sequelize.INTEGER),
        period_in_seconds: column(Sequelize.INTEGER),
      },
      { schema }
    );
    await queryInterface.createTable(
      "barcode_validations",
      {
        ...baseColumns(Sequelize),
        type: column(Sequelize.ENUM('prefix')),
        value: column(Sequelize.STRING),
      },
      { schema }
    );
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.dropTable({ tableName: "giftcard_rate_limit", schema });
    await queryInterface.dropTable({ tableName: "barcode_validations", schema });
  }
};
