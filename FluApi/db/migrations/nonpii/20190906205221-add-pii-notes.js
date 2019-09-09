// Copyright (c) 2019 by Audere
//
// Use of this source code is governed by an MIT-style license that
// can be found in the LICENSE file distributed with this file.

'use strict';

const { baseColumns, column, foreignIdKey } = require("../../util");
const schema = "cough";

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.addColumn(
      { tableName: "pii_reviews", schema },
      "notes",
      {
        ...column(Sequelize.TEXT),
        allowNull: true
      }
    );
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.removeColumn({ tableName: "pii_reviews", schema }, 'notes');
  }
};
