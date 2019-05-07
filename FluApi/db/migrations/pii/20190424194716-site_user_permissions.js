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
