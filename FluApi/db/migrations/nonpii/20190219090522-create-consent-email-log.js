'use strict';

module.exports = {
  up: (queryInterface, Sequelize) => {
    return queryInterface.createTable("consent_email", {
      id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: Sequelize.INTEGER
      },
      visit_id: {
        allowNull: false,
        unique: true,
        type: Sequelize.INTEGER,
        references: {
          model: "visits",
          key: "id",
          as: "visitId"
        },
        onDelete: "CASCADE"
      },
      email_requested: {
        allowNull: false,
        type: Sequelize.BOOLEAN,
      },
      consents_sent: {
        allowNull: false,
        type: Sequelize.INTEGER,
      },
      createdAt: {
        allowNull: false,
        type: Sequelize.DATE
      },
      updatedAt: {
        allowNull: false,
        type: Sequelize.DATE
      }
    });
  },

  down: (queryInterface, Sequelize) => {
    return queryInterface.dropTable('consent_email');
  }
};
