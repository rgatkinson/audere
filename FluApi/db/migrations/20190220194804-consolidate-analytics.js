'use strict';

module.exports = {
  up: (queryInterface, Sequelize) => {
    // This migration is pre-release, so no need to preserve existing data.
    return Promise.all([
      queryInterface.createTable('fever_client_analytics', {
        id: identity(column(Sequelize.INTEGER)),
        createdAt: column(Sequelize.DATE),
        updatedAt: column(Sequelize.DATE),
        csruid: unique(column(Sequelize.STRING)),
        device: column(Sequelize.JSON),
        analytics: column(Sequelize.JSON),
      }),
      queryInterface.dropTable('fever_client_log_batches'),
      queryInterface.dropTable('fever_client_logs'),
    ]);
  },

  down: (queryInterface, Sequelize) => {
    return Promise.all([
      queryInterface.createTable('fever_client_logs', {
        id: identity(column(Sequelize.INTEGER)),
        createdAt: column(Sequelize.DATE),
        updatedAt: column(Sequelize.DATE),
        device: column(Sequelize.JSON),
        level: column(Sequelize.INTEGER),
        log: column(Sequelize.STRING)
      }),
      queryInterface.createTable('fever_client_log_batches', {
        id: identity(column(Sequelize.INTEGER)),
        createdAt: column(Sequelize.DATE),
        updatedAt: column(Sequelize.DATE),
        csruid: unique(column(Sequelize.STRING)),
        device: column(Sequelize.JSON),
        batch: column(Sequelize.JSON)
      }),
      queryInterface.dropTable('fever_client_analytics'),
    ]);
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

// All columns disallow null
function column(type) {
  return {
    allowNull: false,
    type
  };
}
