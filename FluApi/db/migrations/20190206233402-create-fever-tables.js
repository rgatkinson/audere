'use strict';

module.exports = {
  up: (queryInterface, Sequelize) => {
    return Promise.all(
      queryInterface.createTable("fever_screenings", {
        ...basicTable(),
        csruid: unique(stringColumn()),
        device: jsonColumn(),
        screening: jsonColumn(),
      }),
      queryInterface.createTable("fever_access_keys", {
        ...basicTable(),
        key: stringColumn(),
        valid: booleanColumn(),
      })
    );
  },

  down: (queryInterface, Sequelize) => {
    return Promise.all(
      queryInterface.dropTable("fever_screenings"),
    );
  }
};

function basicTable() {
  return {
    id: idColumn(),
    createdAt: dateColumn(),
    updatedAt: dateColumn(),
  };
}

function idColumn() {
  return {
    allowNull: false,
    autoIncrement: true,
    primaryKey: true,
    type: Sequelize.INTEGER
  };
}

function unique(column) {
  return {
    ...column,
    unique: true
  }
}

function stringColumn() {
  return {
    allowNull; false,
    type: Sequelize.STRING
  };
}

function booleanColumn() {
  return {
    allowNull: false,
    type: Sequelize.BOOLEAN
  };
}

function jsonColumn() {
  return {
    allowNull: false,
    type: Sequelize.JSON
  };
}

function dateColumn() {
  return {
    allowNull: false,
    type: Sequelize.DATE
  };
}
