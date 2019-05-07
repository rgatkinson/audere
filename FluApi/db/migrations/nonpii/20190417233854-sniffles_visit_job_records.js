'use strict';

const {
  column,
  identity,
} = require("../../util");

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.createTable("sniffles_visit_job_records", {
      id: identity(column(Sequelize.INTEGER)),
      createdAt: column(Sequelize.DATE),
      updatedAt: column(Sequelize.DATE),
      visitId: {
        allowNull: false,
        type: Sequelize.INTEGER,
        references: {
          model: 'visits',
          key: 'id',
          as: 'visitId',
        },
        onDelete: "CASCADE"
      },
      jobName: column(Sequelize.STRING),
      result: column(Sequelize.JSONB),
    });
    await queryInterface.addConstraint('sniffles_visit_job_records', ['visitId', 'jobName'], {
      type: 'UNIQUE',
      name: 'visit_id_job_name_unique',
    });
  },

  down: (queryInterface, Sequelize) => {
    return queryInterface.dropTable('sniffles_visit_job_records');
  }
};
