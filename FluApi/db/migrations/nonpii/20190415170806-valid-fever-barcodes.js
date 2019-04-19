// Copyright (c) 2019 by Audere
//
// Use of this source code is governed by an MIT-style license that
// can be found in the LICENSE file distributed with this file.

"use strict";

const { column, identity, unique } = require("../../util");

module.exports = {
  up: async (queryInterface, Sequelize) => {
    return queryInterface.createTable("fever_box_barcodes", {
      id: identity(column(Sequelize.INTEGER)),
      barcode: unique(column(Sequelize.STRING)),
      createdAt: column(Sequelize.DATE),
      updatedAt: column(Sequelize.DATE)
    });
  },

  down: async (queryInterface, Sequelize) => {
    return queryInterface.dropTable("fever_box_barcodes");
  }
};
