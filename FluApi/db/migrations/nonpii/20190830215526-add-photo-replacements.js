// Copyright (c) 2019 by Audere
//
// Use of this source code is governed by an MIT-style license that
// can be found in the LICENSE file distributed with this file.

'use strict';

const { baseColumns, column, foreignIdKey } = require("../../util");
const schema = "cough";

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.createTable(
      "photo_replacement_log",
      {
        ...baseColumns(Sequelize),
        photoId: {
          ...foreignIdKey(Sequelize, {
            tableName: "photos",
            schema: "cough"
          }),
          unique: false
        },
        oldPhotoHash: column(Sequelize.STRING),
        newPhotoHash: column(Sequelize.STRING),
        replacerId: column(Sequelize.INTEGER),
      },
      { schema }
    );
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.dropTable({ tableName: "photo_replacement_log", schema });
  }
};
