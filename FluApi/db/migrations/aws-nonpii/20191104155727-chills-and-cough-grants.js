// Copyright (c) 2019 by Audere
//
// Use of this source code is governed by an MIT-style license that
// can be found in the LICENSE file distributed with this file.

"use strict";

module.exports = {
  up: async (queryInterface, Sequelize) => {
    // Make everything cough_derived readable for metabase
    await queryInterface.sequelize.query(`
      grant usage
        on schema cough_derived
        to metabase_cough;

      grant select
        on all tables
        in schema cough_derived
        to metabase_cough;

      alter default privileges
        in schema cough_derived
        grant select
          on tables
          to metabase_cough;
    `);

    // Make everything chills_derived readable for metabase
    await queryInterface.sequelize.query(`
      grant usage
        on schema chills_derived
        to metabase_chills;

      grant select
        on all tables
        in schema chills_derived
        to metabase_chills;

      alter default privileges
        in schema chills_derived
        grant select
          on tables
          to metabase_chills;
    `);
  },

  down: (queryInterface, Sequelize) => {
    // The above is making explicit some things that were implicit before.
    // Since the DOWN state was unspecified, and this is just setting permissions,
    // we leave permissions unchanged here.
  }
};
