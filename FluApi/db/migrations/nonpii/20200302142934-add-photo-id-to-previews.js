// Copyright (c) 2020 by Audere
//
// Use of this source code is governed by an MIT-style license that
// can be found in the LICENSE file distributed with this file.

"use strict";

const { column } = require("../../util");
const schema = "chills";

module.exports = {
  up: async (queryInterface, Sequelize) => {
    return queryInterface.addColumn(
      { tableName: "rdt_preview_frames", schema },
      "photo",
      { ...column(Sequelize.STRING) }
    );
  },

  down: async (queryInterface, Sequelize) => {
    return queryInterface.removeColumn(
      { tableName: "rdt_preview_frames", schema },
      "photo"
    )
  },
};
