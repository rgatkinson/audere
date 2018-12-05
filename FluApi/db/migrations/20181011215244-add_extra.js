// Copyright (c) 2018 by Audere
//
// Use of this source code is governed by an MIT-style license that
// can be found in the LICENSE file distributed with this file.

"use strict";

module.exports = {
  up: (queryInterface, Sequelize) => {
    return queryInterface.addColumn("button_pushes", "extra", Sequelize.TEXT);
  },

  down: (queryInterface, Sequelize) => {
    return queryInterface.removeColumn("button_pushes", "extra");
  }
};
