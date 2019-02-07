// Copyright (c) 2019 by Audere
//
// Use of this source code is governed by an MIT-style license that
// can be found in the LICENSE file distributed with this file.

"use strict";

module.exports = {
  up: (queryInterface, Sequelize) => {
    return Promise.all(
      queryInterface.createTable("fever_screenings", {
        id: idColumn(),
        createdAt: dateColumn(),
        updatedAt: dateColumn(),
        csruid: unique(stringColumn()),
        device: jsonColumn(),
        screenings: jsonColumn()
      }),
      queryInterface.createTable("fever_screenings_backups", {
        id: idColumn(),
        createdAt: dateColumn(),
        updatedAt: dateColumn(),
        csruid: unique(stringColumn()),
        device: jsonColumn(),
        screenings: jsonColumn()
      }),
      queryInterface.createTable("fever_surveys", {
        id: idColumn(),
        createdAt: dateColumn(),
        updatedAt: dateColumn(),
        csruid: unique(stringColumn()),
        device: jsonColumn(),
        surveys: jsonColumn()
      }),
      queryInterface.createTable("fever_surveys_backups", {
        id: idColumn(),
        createdAt: dateColumn(),
        updatedAt: dateColumn(),
        csruid: unique(stringColumn()),
        device: jsonColumn(),
        surveys: jsonColumn()
      }),
      queryInterface.createTable("fever_access_keys", {
        id: idColumn(),
        createdAt: dateColumn(),
        updatedAt: dateColumn(),
        key: stringColumn(),
        valid: booleanColumn()
      }),
      queryInterface.createTable("fever_client_logs", {
        id: idColumn(),
        createdAt: dateColumn(),
        updatedAt: dateColumn(),
        device: jsonColumn(),
        level: integerColumn(),
        log: stringColumn()
      }),
      queryInterface.createTable("fever_client_log_batches", {
        id: idColumn(),
        createdAt: dateColumn(),
        updatedAt: dateColumn(),
        csruid: unique(stringColumn()),
        device: jsonColumn(),
        surveys: jsonColumn()
      })
    );
  },

  down: (queryInterface, Sequelize) => {
    return Promise.all(
      [
        "fever_screenings",
        "fever_screenings_backups",
        "fever_surveys",
        "fever_surveys_backups",
        "fever_access_keys",
        "fever_client_logs",
        "fever_client_log_batches"
      ].map(queryInterface.dropTable)
    );
  }
};

function unique(column) {
  return { ...column, unique: true };
}
function stringColumn() {
  return column(Sequelize.STRING);
}
function booleanColumn() {
  return column(Sequelize.BOOLEAN);
}
function jsonColumn() {
  return column(Sequelize.JSON);
}
function integerColumn() {
  return column(Sequelize.INTEGER);
}
function dateColumn() {
  return column(Sequelize.DATE);
}
function column(type) {
  return { allowNull: false, type };
}
function idColumn() {
  return {
    allowNull: false,
    autoIncrement: true,
    primaryKey: true,
    type: Sequelize.INTEGER
  };
}
