// Copyright (c) 2019 by Audere
//
// Use of this source code is governed by an MIT-style license that
// can be found in the LICENSE file distributed with this file.

"use strict";

const { baseColumns, column, unique } = require("../../util");
const schema = "cough";

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.sequelize.createSchema(schema);

    await queryInterface.createTable(
      "access_keys",
      {
        ...baseColumns(Sequelize),
        key: column(Sequelize.STRING),
        valid: column(Sequelize.BOOLEAN)
      },
      { schema }
    );
    await queryInterface.createTable(
      "current_surveys",
      {
        ...baseColumns(Sequelize),
        docid: unique(column(Sequelize.STRING)),
        device: column(Sequelize.JSONB),
        survey: column(Sequelize.JSONB)
      },
      { schema }
    );
    await queryInterface.createTable(
      "backup_surveys",
      {
        ...baseColumns(Sequelize),
        docid: unique(column(Sequelize.STRING)),
        device: column(Sequelize.JSONB),
        survey: column(Sequelize.JSONB)
      },
      { schema }
    );
    await queryInterface.createTable(
      "photos",
      {
        ...baseColumns(Sequelize),
        docid: unique(column(Sequelize.STRING)),
        device: column(Sequelize.JSONB),
        photo: column(Sequelize.JSONB)
      },
      { schema }
    );

    await queryInterface.sequelize.query(`
      INSERT INTO cough.access_keys
              (id, "createdAt", "updatedAt", key, valid)
        SELECT id, "createdAt", "updatedAt", key, valid from cough_access_keys;
    `);

    await queryInterface.sequelize.query(`
      INSERT INTO cough.current_surveys
              (id, "createdAt", "updatedAt", docid, device, survey)
        SELECT id, "createdAt", "updatedAt", docid, device, survey from cough_current_surveys;
    `);

    await queryInterface.sequelize.query(`
      INSERT INTO cough.backup_surveys
              (id, "createdAt", "updatedAt", docid, device, survey)
        SELECT id, "createdAt", "updatedAt", docid, device, survey from cough_backup_surveys;
    `);

    await queryInterface.sequelize.query(`
      INSERT INTO cough.photos
              (id, "createdAt", "updatedAt", docid, device, photo)
        SELECT id, "createdAt", "updatedAt", docid, device, photo from cough_photos;
    `);

    // https://stackoverflow.com/a/2022824
    await queryInterface.sequelize.query(`
      SELECT setval(
        pg_get_serial_sequence('cough.current_surveys', 'id'),
        (select max(id) from cough_current_surveys)
      );
    `);

    await queryInterface.dropTable("cough_access_keys");
    await queryInterface.dropTable("cough_current_surveys");
    await queryInterface.dropTable("cough_backup_surveys");
    await queryInterface.dropTable("cough_photos");
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.createTable("cough_access_keys", {
      ...baseColumns(Sequelize),
      key: column(Sequelize.STRING),
      valid: column(Sequelize.BOOLEAN)
    });
    await queryInterface.createTable("cough_current_surveys", {
      ...baseColumns(Sequelize),
      docid: unique(column(Sequelize.STRING)),
      device: column(Sequelize.JSONB),
      survey: column(Sequelize.JSONB)
    });
    await queryInterface.createTable("cough_backup_surveys", {
      ...baseColumns(Sequelize),
      docid: unique(column(Sequelize.STRING)),
      device: column(Sequelize.JSONB),
      survey: column(Sequelize.JSONB)
    });
    await queryInterface.createTable("cough_photos", {
      ...baseColumns(Sequelize),
      docid: unique(column(Sequelize.STRING)),
      device: column(Sequelize.JSONB),
      photo: column(Sequelize.JSONB)
    });

    await queryInterface.sequelize.query(`
      INSERT INTO cough_access_keys
              (id, "createdAt", "updatedAt", key, valid)
        SELECT id, "createdAt", "updatedAt", key, valid from cough.access_keys;
    `);

    await queryInterface.sequelize.query(`
      INSERT INTO cough_current_surveys
              (id, "createdAt", "updatedAt", docid, device, survey)
        SELECT id, "createdAt", "updatedAt", docid, device, survey from cough.current_surveys;
    `);

    await queryInterface.sequelize.query(`
      INSERT INTO cough_backup_surveys
              (id, "createdAt", "updatedAt", docid, device, survey)
        SELECT id, "createdAt", "updatedAt", docid, device, survey from cough.backup_surveys;
    `);

    await queryInterface.sequelize.query(`
      INSERT INTO cough_photos
              (id, "createdAt", "updatedAt", docid, device, photo)
        SELECT id, "createdAt", "updatedAt", docid, device, photo from cough.photos;
    `);

    // https://stackoverflow.com/a/2022824
    await queryInterface.sequelize.query(`
      SELECT setval(
        pg_get_serial_sequence('cough_current_surveys', 'id'),
        (select max(id) from cough.current_surveys)
      );
    `);

    await queryInterface.dropTable("access_keys", { schema });
    await queryInterface.dropTable("current_surveys", { schema });
    await queryInterface.dropTable("backup_surveys", { schema });
    await queryInterface.dropTable("photos", { schema });

    await queryInterface.sequelize.dropSchema(schema);
  }
};
