// Copyright (c) 2019 by Audere
//
// Use of this source code is governed by an MIT-style license that
// can be found in the LICENSE file distributed with this file.

"use strict";

const { baseColumns, column, unique } = require("../util");

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.addColumn(
      "data_pipeline_nodes",
      "pipeline",
      {
        ...column(Sequelize.INTEGER),
        allowNull: true,
      }
    );

    await queryInterface.createTable("data_pipelines", {
      ...baseColumns(Sequelize),
      name: unique(column(Sequelize.STRING)),
    });

    await queryInterface.bulkInsert("data_pipelines", [{
      id: 1,
      name: "cough_pipeline",
      createdAt: new Date(),
      updatedAt: new Date()
    }]);

    await queryInterface.bulkUpdate(
      "data_pipeline_nodes",
      { pipeline: 1 },
      {}
    );

    await queryInterface.addConstraint(
      "data_pipeline_nodes",
      ["id"],
      {
        type: "FOREIGN KEY",
        name: "FK_dataPipelineNode_dataPipeline",
        references: {
          table: "data_pipelines",
          field: "id"
        },
        onDelete: "CASCADE"
      }
    );

    await queryInterface.changeColumn(
      "data_pipeline_nodes",
      "pipeline",
      {
        ...column(Sequelize.INTEGER),
        allowNull: false,
      }
    );
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.removeConstraint(
      "data_pipeline_nodes",
      "FK_dataPipelineNode_dataPipeline"
    );
    await queryInterface.removeColumn("data_pipeline_nodes", "pipeline");
    await queryInterface.dropTable("data_pipelines");
  }
};
