// Copyright (c) 2019 by Audere
//
// Use of this source code is governed by an MIT-style license that
// can be found in the LICENSE file distributed with this file.

"use strict";

module.exports = {
  up: (queryInterface, Sequelize) => {
    return queryInterface.removeColumn(
      "smarty_street_responses",
      "max_candidates"
    );
  },

  down: (queryInterface, Sequelize) => {
    return queryInterface.addColumn(
      "smarty_street_responses",
      "max_candidates",
      {
        allowNull: false,
        type: Sequelize.INTEGER
      }
    );
  }
};
