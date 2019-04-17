// Copyright (c) 2019 by Audere
//
// Use of this source code is governed by an MIT-style license that
// can be found in the LICENSE file distributed with this file.

"use strict";

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.addColumn(
      "fever_received_kits",
      "recordId",
      {
        allowNull: true,
        type: Sequelize.INTEGER,
        unique: true
      }
    );

    await queryInterface.addColumn(
      "fever_received_kits",
      "linked",
      {
        allowNull: false,
        type: Sequelize.BOOLEAN,
        defaultValue: false
      }
    );

    await queryInterface.changeColumn(
      "fever_received_kits",
      "fileId",
      {
        allowNull: true,
        type: Sequelize.INTEGER,
        onDelete: "CASCADE"
      }
    );

    await queryInterface.changeColumn(
      "fever_received_kits",
      "dateReceived",
      {
        allowNull: true,
        type: Sequelize.STRING
      }
    );
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.removeColumn(
      "fever_received_kits",
      "recordId"
    );

    await queryInterface.removeColumn(
      "fever_received_kits",
      "linked"
    );

    await queryInterface.changeColumn(
      "fever_received_kits",
      "fileId",
      {
        allowNull: false,
        type: Sequelize.INTEGER,
        onDelete: "CASCADE"
      }
    );

    await queryInterface.changeColumn(
      "fever_received_kits",
      "dateReceived",
      {
        allowNull: false,
        type: Sequelize.STRING
      }
    );
  }
}
