// Copyright (c) 2018 by Audere
//
// Use of this source code is governed by an MIT-style license that
// can be found in the LICENSE file distributed with this file.

"use strict";

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.createTable("fever_followup_batches", {
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

    await queryInterface.createTable("fever_followup_items", {
      id: {
        allowNull: false,
        primaryKey: true,
        type: Sequelize.INTEGER
      },
      batchId: {
        allowNull: false,
        type: Sequelize.INTEGER,
        references: {
          model: "fever_followup_batches",
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

    await queryInterface.createTable("fever_followup_discards", {
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
          model: "fever_followup_batches",
          key: "id",
          as: "batchId"
        },
        onDelete: "CASCADE"
      },
      workflowId: {
        allowNull: false,
        type: Sequelize.INTEGER,
        references: {
          model: "fever_followup_items",
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

    await queryInterface.sequelize.query(
      `insert into gapless_seq (name, index, "createdAt", "updatedAt")
       values ('FollowUp_Batch', 0, current_timestamp, current_timestamp)`
    );
    await queryInterface.sequelize.query(
      `insert into gapless_seq (name, index, "createdAt", "updatedAt")
        values ('FollowUp_Items', 0, current_timestamp, current_timestamp)`
    );
  },
  down: async (queryInterface, Sequelize) => {
    await queryInterface.dropTable("fever_followup_items");
    await queryInterface.dropTable("fever_followup_batches");
    await queryInterface.dropTable("fever_followup_discards");
    await queryInterface.sequelize.query(
      `delete from gapless_seq
       where name in ('FollowUp_Batch', 'FollowUp_Items')`
    );
  }
};
