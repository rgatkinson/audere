// Copyright (c) 2018 by Audere
//
// Use of this source code is governed by an MIT-style license that
// can be found in the LICENSE file distributed with this file.

"use strict";

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.createTable("fever_processed_kit_files", {
      id: {
        allowNull: false,
        primaryKey: true,
        autoIncrement: true,
        type: Sequelize.INTEGER
      },
      file: {
        allowNull: false,
        unique: true,
        type: Sequelize.STRING
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

    await queryInterface.createTable("fever_received_kits", {
      id: {
        allowNull: false,
        primaryKey: true,
        autoIncrement: true,
        type: Sequelize.INTEGER
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
      fileId: {
        allowNull: false,
        type: Sequelize.INTEGER,
        references: {
          model: "fever_processed_kit_files",
          key: "id",
          as: "fileId"
        },
        onDelete: "CASCADE"
      },
      boxBarcode: {
        allowNull: false,
        unique: true,
        type: Sequelize.STRING
      },
      dateReceived: {
        allowNull: false,
        type: Sequelize.STRING
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
    await queryInterface.dropTable("fever_received_kits");
    await queryInterface.dropTable("fever_processed_kit_files");
  }
};
