// Copyright (c) 2019 by Audere
//
// Use of this source code is governed by an MIT-style license that
// can be found in the LICENSE file distributed with this file.

"use strict";

const { baseColumns, foreignIdKey } = require("../../util");
const schema = "cough";

module.exports = {
  up: (queryInterface, Sequelize) => {
    return queryInterface.createTable(
      "photo_upload_log",
      {
        ...baseColumns(Sequelize),
        cough_survey_id: foreignIdKey(Sequelize, {
          tableName: "current_surveys",
          schema: "cough"
        })
      },
      { schema }
    );
  },

  down: (queryInterface, Sequelize) => {
    return queryInterface.dropTable({ tableName: "photo_upload_log", schema });
  }
};
