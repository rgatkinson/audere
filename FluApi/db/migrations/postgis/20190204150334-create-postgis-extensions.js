// Copyright (c) 2018 by Audere
//
// Use of this source code is governed by an MIT-style license that
// can be found in the LICENSE file distributed with this file.

"use strict";

module.exports = {
  up: (queryInterface, Sequelize) => {
    return queryInterface.sequelize
      .query("CREATE EXTENSION IF NOT EXISTS postgis")
      .then(() => {
        return queryInterface.sequelize.query(
          "CREATE EXTENSION IF NOT EXISTS fuzzystrmatch"
        );
      })
      .then(() => {
        return queryInterface.sequelize.query(
          "CREATE EXTENSION IF NOT EXISTS postgis_tiger_geocoder"
        );
      })
      .then(() => {
        return queryInterface.sequelize.query(
          "CREATE EXTENSION IF NOT EXISTS postgis_topology"
        );
      });
  },
  down: (queryInterface, Sequelize) => {
    return queryInterface.sequelize
      .query("DROP EXTENSION IF EXISTS postgis CASCADE")
      .then(() => {
        return queryInterface.sequelize.query(
          "DROP EXTENSION IF EXISTS fuzzystrmatch CASCADE"
        );
      })
      .then(() => {
        return queryInterface.sequelize.query(
          "DROP EXTENSION IF EXISTS postgis_tiger_geocoder CASCADE"
        );
      })
      .then(() => {
        return queryInterface.sequelize.query(
          "DROP EXTENSION IF EXISTS postgis_topology CASCADE"
        );
      });
  }
};
