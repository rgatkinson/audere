// Copyright (c) 2019 by Audere
//
// Use of this source code is governed by an MIT-style license that
// can be found in the LICENSE file distributed with this file.

"use strict";

module.exports = {
  up: (queryInterface, Sequelize) => {
    return queryInterface.createTable("fever_photos", {
      id: identity(column(Sequelize.INTEGER)),
      createdAt: column(Sequelize.DATE),
      updatedAt: column(Sequelize.DATE),
      csruid: unique(column(Sequelize.STRING)),
      device: column(Sequelize.JSON),
      photo: column(Sequelize.JSON)
    });
  },

  down: (queryInterface, Sequelize) => {
    return queryInterface.dropTable("fever_photos");
  }
};

function identity(column) {
  return {
    ...column,
    autoIncrement: true,
    primaryKey: true
  };
}

function unique(column) {
  return {
    ...column,
    unique: true
  };
}

// All columns disallow null
function column(type) {
  return {
    allowNull: false,
    type
  };
}
