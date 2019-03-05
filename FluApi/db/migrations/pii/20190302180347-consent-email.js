// Copyright (c) 2019 by Audere
//
// Use of this source code is governed by an MIT-style license that
// can be found in the LICENSE file distributed with this file.

"use strict";
const { baseColumns, foreignIdKey, nullableColumn } = require("../../util");

module.exports = {
  up: (queryInterface, Sequelize) => {
    return queryInterface.createTable("fever_consent_emails", {
      ...baseColumns(Sequelize),
      survey_id: foreignIdKey(Sequelize, "fever_current_surveys"),
      completed: nullableColumn(Sequelize.STRING)
    });
  },

  down: (queryInterface, Sequelize) => {
    return queryInterface.dropTable("fever_consent_emails");
  }
};
