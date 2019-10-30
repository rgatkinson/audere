// Copyright (c) 2019 by Audere
//
// Use of this source code is governed by an MIT-style license that
// can be found in the LICENSE file distributed with this file.

"use strict";

const { baseColumns, column, unique, foreignIdKey } = require("../../util");
const schema = "chills";
const derivedSchema = "chills_derived";

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.sequelize.createSchema(schema);

    await queryInterface.createTable(
      "access_keys",
      {
        ...baseColumns(Sequelize),
        key: column(Sequelize.STRING),
        valid: column(Sequelize.BOOLEAN)
      },
      { schema }
    );
    await queryInterface.createTable(
      "current_surveys",
      {
        ...baseColumns(Sequelize),
        docid: unique(column(Sequelize.STRING)),
        device: column(Sequelize.JSONB),
        survey: column(Sequelize.JSONB)
      },
      { schema }
    );
    await queryInterface.createTable(
      "backup_surveys",
      {
        ...baseColumns(Sequelize),
        docid: unique(column(Sequelize.STRING)),
        device: column(Sequelize.JSONB),
        survey: column(Sequelize.JSONB)
      },
      { schema }
    );
    await queryInterface.createTable(
      "photos",
      {
        ...baseColumns(Sequelize),
        docid: unique(column(Sequelize.STRING)),
        device: column(Sequelize.JSONB),
        photo: column(Sequelize.JSONB)
      },
      { schema }
    );
    await queryInterface.createTable(
      "photo_replacement_log",
      {
        ...baseColumns(Sequelize),
        photoId: {
          ...foreignIdKey(Sequelize, {
            tableName: "photos",
            schema: schema
          }),
          unique: false
        },
        oldPhotoHash: column(Sequelize.STRING),
        newPhotoHash: column(Sequelize.STRING),
        replacerId: column(Sequelize.INTEGER),
      },
      { schema }
    );
    await queryInterface.createTable(
      "photo_upload_log",
      {
        ...baseColumns(Sequelize),
        cough_survey_id: foreignIdKey(Sequelize, {
          tableName: "current_surveys",
          schema: schema
        })
      },
      { schema }
    );
    await queryInterface.createTable(
      "expert_read",
      {
        ...baseColumns(Sequelize),
        surveyId: foreignIdKey(Sequelize, {
          tableName: "current_surveys",
          schema: schema
        }),
        interpretation: column(Sequelize.STRING),
        interpreterId: column(Sequelize.INTEGER),
      },
      { schema }
    );

    await queryInterface.sequelize.createSchema(derivedSchema);
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.sequelize.dropSchema(derivedSchema);

    await queryInterface.dropTable("access_keys", { schema });
    await queryInterface.dropTable("current_surveys", { schema });
    await queryInterface.dropTable("backup_surveys", { schema });
    await queryInterface.dropTable("photos", { schema });
    await queryInterface.dropTable("photo_replacement_log", { schema });
    await queryInterface.dropTable("photo_upload_log", { schema });
    await queryInterface.dropTable("expert_read", { schema });

    await queryInterface.sequelize.dropSchema(schema);
  }
};

