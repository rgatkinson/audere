'use strict';
const { column, identity, nullableColumn, primaryKey, unique } = require("../../util");

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
        token: column(Sequelize.STRING),
      }),
      queryInterface.createTable("site_sessions", {
        createdAt: column(Sequelize.DATE),
        updatedAt: column(Sequelize.DATE),
        sid: primaryKey(column(Sequelize.STRING)),
        expires: column(Sequelize.DATE),
        data: column(Sequelize.STRING(50000)),
      }),
    ]);
  },

  down: (queryInterface, Sequelize) => {
    return Promise.all([
      queryInterface.dropTable("site_users"),
      queryInterface.dropTable("site_sessions"),
    ]);
  }
};
