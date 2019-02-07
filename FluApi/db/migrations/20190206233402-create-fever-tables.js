// Copyright (c) 2019 by Audere
//
// Use of this source code is governed by an MIT-style license that
// can be found in the LICENSE file distributed with this file.

"use strict";

module.exports = {
  up: (queryInterface, Sequelize) => {
    return Promise.all(
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
      }),
      queryInterface.createTable("fever_feedback", {
        id: idColumn(),
        createdAt: dateColumn(),
        updatedAt: dateColumn(),
        device: jsonColumn(),
        subject: stringColumn(),
        body: stringColumn()
      }),
      queryInterface.createTable("fever_current_surveys", {
        id: idColumn(),
        createdAt: dateColumn(),
        updatedAt: dateColumn(),
        csruid: unique(stringColumn()),
        device: jsonColumn(),
        surveys: jsonColumn()
      }),
      queryInterface.createTable("fever_backup_surveys", {
        id: idColumn(),
        createdAt: dateColumn(),
        updatedAt: dateColumn(),
        csruid: unique(stringColumn()),
        device: jsonColumn(),
        surveys: jsonColumn()
      }),
    );
  },

  down: (queryInterface, Sequelize) => {
    return Promise.all(
      [
        "fever_access_keys",
        "fever_client_logs",
        "fever_client_log_batches",
        "fever_feedback",
        "fever_current_surveys",
        "fever_backup_surveys",
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
