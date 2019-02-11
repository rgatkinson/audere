'use strict';

module.exports = {
  up: (queryInterface, Sequelize) => {
    return queryInterface.createTable("portal_users", {
      id: identity(column(Sequelize.INTEGER)),
      createdAt: column(Sequelize.DATE),
      updatedAt: column(Sequelize.DATE),
      uuid: unique(column(Sequelize.UUID)),
      userid: unique(column(Sequelize.STRING)),
      salt: column(Sequelize.STRING),
      token: column(Sequelize.STRING),
    });
  },

  down: (queryInterface, Sequelize) => {
    return queryInterface.dropTable("portal_users");
  }
};

function identity(column) {
  return {
    ...column,
    autoIncrement: true,
    primaryKey: true,
  };
}

function unique(column) {
  return {
    ...column,
    unique: true
  };
}

function column(type) {
  return {
    allowNull: false,
    type
  };
}
