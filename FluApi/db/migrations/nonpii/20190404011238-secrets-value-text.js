// Copyright (c) 2019 by Audere
//
// Use of this source code is governed by an MIT-style license that
// can be found in the LICENSE file distributed with this file.

"use strict";

module.exports = {
  up: (queryInterface, Sequelize) => {
    return queryInterface.changeColumn(
      "secrets",
      "value",
      {
        allowNull: false,
        type: Sequelize.TEXT
      }
    );
  },

  down: (queryInterface, Sequelize) => {
    return queryInterface.changeColumn(
      "secrets",
      "value",
      {
        allowNull: false,
        type: Sequelize.STRING
      }
    );
  }
};
