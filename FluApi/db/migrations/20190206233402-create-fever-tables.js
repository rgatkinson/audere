// Copyright (c) 2019 by Audere
//
// Use of this source code is governed by an MIT-style license that
// can be found in the LICENSE file distributed with this file.

"use strict";

module.exports = {
  up: (queryInterface, Sequelize) => {
    // Every table includes these columns
    function basicTable(name, columns) {
      return queryInterface.createTable(name, {
        id: identity(column(Sequelize.INTEGER)),
        createdAt: column(Sequelize.DATE),
        updatedAt: column(Sequelize.DATE),
        ...columns
      });
    }

    // Upload tables add these columns
    function uploadTable(name, columns) {
      return basicTable(name, {
        csruid: unique(column(Sequelize.STRING)),
        device: column(Sequelize.JSON),
        ...columns
      });
    }

    return Promise.all([
      basicTable("fever_access_keys", {
        key: column(Sequelize.STRING),
        valid: column(Sequelize.BOOLEAN)
      }),
      basicTable("fever_client_logs", {
        device: column(Sequelize.JSON),
        level: column(Sequelize.INTEGER),
        log: column(Sequelize.STRING)
      }),
      uploadTable("fever_client_log_batches", {
        batch: column(Sequelize.JSON)
      }),
      basicTable("fever_feedback", {
        device: column(Sequelize.JSON),
        subject: column(Sequelize.STRING),
        body: column(Sequelize.STRING)
      }),
      uploadTable("fever_current_surveys", {
        survey: column(Sequelize.JSON)
      }),
      uploadTable("fever_backup_surveys", {
        survey: column(Sequelize.JSON)
      })
    ]);
  },

  down: (queryInterface, Sequelize) => {
    return Promise.all(
      [
        "fever_access_keys",
        "fever_client_logs",
        "fever_client_log_batches",
        "fever_feedback",
        "fever_current_surveys",
        "fever_backup_surveys"
      ].map(name => queryInterface.dropTable(name))
    );
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
