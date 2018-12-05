// Copyright (c) 2018 by Audere
//
// Use of this source code is governed by an MIT-style license that
// can be found in the LICENSE file distributed with this file.

"use strict";
module.exports = {
  up: (queryInterface, Sequelize) => {
    return queryInterface.createTable("visits", {
      id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: Sequelize.INTEGER
      },
      csruid: {
        allowNull: false,
        unique: true,
        type: Sequelize.STRING
      },
      device: {
        allowNull: false,
        type: Sequelize.JSON
      },
      visit: {
        allowNull: false,
        type: Sequelize.JSON
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
    return queryInterface.dropTable("visits");
  }
};
