// Copyright (c) 2019 by Audere
//
// Use of this source code is governed by an MIT-style license that
// can be found in the LICENSE file distributed with this file.

"use strict";

const schema = "cough_derived";

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.createSchema(schema);
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.sequelize.dropSchema(schema);
  }
};
