'use strict';
module.exports = {
  up: (queryInterface, Sequelize) => {
    return queryInterface.createTable('button_pushes', {
      deviceId: {
        type: Sequelize.UUID,
        allowNull: false,
        validate: {
          isUUID: 4,
        },
      },
      timestamp: {
        type: Sequelize.DATE,
        allowNull: false,
      },
      count: {
        type: Sequelize.INTEGER,
        allowNull: false,
      },
    });
  },
  down: (queryInterface, Sequelize) => {
    return queryInterface.dropTable('button_pushes');
  }
};
