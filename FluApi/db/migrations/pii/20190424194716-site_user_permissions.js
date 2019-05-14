// Copyright (c) 2019 by Audere
//
// Use of this source code is governed by an MIT-style license that
// can be found in the LICENSE file distributed with this file.

"use strict";

const { column, identity, foreignIdKey } = require("../../util");

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.createTable("site_user_permissions", {
      id: identity(column(Sequelize.INTEGER)),
      createdAt: column(Sequelize.DATE),
      updatedAt: column(Sequelize.DATE),
      userId: foreignIdKey(Sequelize, "site_users"),
      permission: column(Sequelize.STRING)
    });
    await queryInterface.addConstraint(
      "site_user_permissions",
      ["userId", "permission"],
      {
        name: "userid_permission_unique",
        type: "UNIQUE"
      }
    );
  },

  down: (queryInterface, Sequelize) => {
    return queryInterface.dropTable("site_user_permissions");
  }
};
