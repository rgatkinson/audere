// Copyright (c) 2019 by Audere
//
// Use of this source code is governed by an MIT-style license that
// can be found in the LICENSE file distributed with this file.

const { column, nullableColumn } = require("../../util");
const schema = "cough";

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.changeColumn(
      {
        tableName: "aspren_data",
        schema: schema
      },
      "date_onset",
      { ...nullableColumn(Sequelize.STRING) }
    );
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.changeColumn(
      {
        tableName: "aspren_data",
        schema: schema
      },
      "date_onset",
      { ...column(Sequelize.STRING) }
    );
  }
};
