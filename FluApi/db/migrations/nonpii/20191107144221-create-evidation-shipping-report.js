// Copyright (c) 2019 by Audere
//
// Use of this source code is governed by an MIT-style license that
// can be found in the LICENSE file distributed with this file.

"use strict";

const { baseColumns, column, unique } = require("../../util");
const schema = "chills";

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.createTable(
      "shipped_kits",
      {
        ...baseColumns(Sequelize),
        evidation_id: unique(column(Sequelize.STRING)),
        barcode: unique(column(Sequelize.STRING)),
        email: column(Sequelize.STRING),
        birthdate: column(Sequelize.STRING),
        sex: column(Sequelize.STRING),
        city: column(Sequelize.STRING),
        state: column(Sequelize.STRING),
        postal_code: column(Sequelize.STRING),
        ordered_at: column(Sequelize.STRING),
      },
      { schema }
    );

    await queryInterface.createTable(
      "matched_kits",
      {
        ...baseColumns(Sequelize),
        barcode: column(Sequelize.STRING),
        identifier: column(Sequelize.STRING),
      },
      { schema }
    );
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.dropTable("kit_orders", { schema });
    await queryInterface.dropTable("matched_kits", { schema });
  }
};