// Copyright (c) 2019 by Audere
//
// Use of this source code is governed by an MIT-style license that
// can be found in the LICENSE file distributed with this file.

'use strict';

const { baseColumns, column, foreignIdKey } = require("../../util");
const schema = "cough";

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.createTable(
      "pii_reviews",
      {
        ...baseColumns(Sequelize),
        surveyId: foreignIdKey(Sequelize, {
          tableName: "current_surveys",
          schema: "cough"
        }),
        containsPii: column(Sequelize.BOOLEAN),
        reviewerId: column(Sequelize.INTEGER),
      },
      { schema }
    );
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.dropTable({ tableName: "pii_reviews", schema });
  }
};
