// Copyright (c) 2019 by Audere
//
// Use of this source code is governed by an MIT-style license that
// can be found in the LICENSE file distributed with this file.

"use strict";
const {
  column,
  identity,
  nullableColumn,
  primaryKey,
  unique
} = require("../../util");

module.exports = {
  up: (queryInterface, Sequelize) => {
    return Promise.all([
      queryInterface.createTable("site_users", {
        id: identity(column(Sequelize.INTEGER)),
        createdAt: column(Sequelize.DATE),
        updatedAt: column(Sequelize.DATE),
        uuid: unique(column(Sequelize.UUID)),
        userid: unique(column(Sequelize.STRING)),
        salt: column(Sequelize.STRING),
        token: column(Sequelize.STRING)
      }),
      queryInterface.createTable("site_sessions", {
        createdAt: column(Sequelize.DATE),
        updatedAt: column(Sequelize.DATE),
        sid: primaryKey(column(Sequelize.STRING)),
        expires: column(Sequelize.DATE),
        data: column(Sequelize.STRING(50000))
      })
    ]);
  },

  down: (queryInterface, Sequelize) => {
    return Promise.all([
      queryInterface.dropTable("site_users"),
      queryInterface.dropTable("site_sessions")
    ]);
  }
};
