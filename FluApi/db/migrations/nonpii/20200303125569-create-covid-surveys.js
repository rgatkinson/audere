// Copyright (c) 2020 by Audere
//
// Use of this source code is governed by an MIT-style license that
// can be found in the LICENSE file distributed with this file.

"use strict";

const { baseColumns, column, nullableColumn } = require("../../util");
const schema = "covid";

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.createTable(
      "surveys",
      {
        ...baseColumns(Sequelize),
      },
      { schema }
    );
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.dropTable("surveys", { schema });
  },
};
