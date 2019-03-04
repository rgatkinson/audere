// Copyright (c) 2018 by Audere
//
// Use of this source code is governed by an MIT-style license that
// can be found in the LICENSE file distributed with this file.

"use strict";

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.createTable("fever_kit_batches", {
      id: {
        allowNull: false,
        primaryKey: true,
        type: Sequelize.INTEGER
      },
      uploaded: {
        allowNull: false,
        type: Sequelize.BOOLEAN
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
    
    await queryInterface.createTable("fever_kit_items", {
      id: {
        allowNull: false,
        primaryKey: true,
        type: Sequelize.INTEGER
      },
      batchId: {
        allowNull: false,
        type: Sequelize.INTEGER,
        references: {
          model: "fever_kit_batches",
          key: "id",
          as: "batchId"
        },
        onDelete: "CASCADE"
      },
      surveyId: {
        allowNull: false,
        unique: true,
        type: Sequelize.INTEGER,
        references: {
          model: "fever_current_surveys",
          key: "id",
          as: "surveyId"
        },
        onDelete: "CASCADE"
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

    await queryInterface.createTable("fever_kit_discards", {
      id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: Sequelize.INTEGER
      },
      batchId: {
        allowNull: false,
        type: Sequelize.INTEGER,
        references: {
          model: "fever_kit_batches",
          key: "id",
          as: "batchId"
        },
        onDelete: "CASCADE"
      },
      workflowId: {
        allowNull: false,
        type: Sequelize.INTEGER,
        references: {
          model: "fever_kit_items",
          key: "id",
          as: "workflowId"
        },
        onDelete: "CASCADE"
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
  down: async (queryInterface, Sequelize) => {
    await queryInterface.dropTables("fever_kit_items");
    await queryInterface.dropTables("fever_kit_batches");
    await queryInterface.dropTables("fever_kit_discards");
  }
};