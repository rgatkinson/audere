// Copyright (c) 2018 by Audere
//
// Use of this source code is governed by an MIT-style license that
// can be found in the LICENSE file distributed with this file.

"use strict";
module.exports = {
  up: (queryInterface, Sequelize) => {
    return queryInterface.createTable("button_pushes", {
      id: {
        type: Sequelize.INTEGER,
        autoIncrement: true,
        primaryKey: true
      },
      deviceId: {
        type: Sequelize.UUID,
        allowNull: false,
        validate: {
          isUUID: 4
        }
      },
      timestamp: {
        type: Sequelize.DATE,
        allowNull: false
      },
      count: {
        type: Sequelize.INTEGER,
        allowNull: false
      }
    });
  },
  down: (queryInterface, Sequelize) => {
    return queryInterface.dropTable("button_pushes");
  }
};
