// Copyright (c) 2019 by Audere
//
// Use of this source code is governed by an MIT-style license that
// can be found in the LICENSE file distributed with this file.

"use strict";

const { column, nullableColumn } = require("../../util");
const schema = "cough";

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.sequelize.query("drop view cough_derived.analytics");

    await queryInterface.changeColumn(
      {
        tableName: "aspren_data",
        schema: schema
      },
      "atsi",
      nullableColumn(Sequelize.STRING)
    );

    await queryInterface.sequelize.query("drop type cough.enum_aspren_data_atsi cascade");

    await queryInterface.changeColumn(
      {
        tableName: "aspren_data",
        schema: schema
      },
      "current_vaccination",
      nullableColumn(Sequelize.STRING)
    );

    await queryInterface.sequelize.query("drop type cough.enum_aspren_data_current_vaccination cascade");

    await queryInterface.changeColumn(
      {
        tableName: "aspren_data",
        schema: schema
      },
      "previous_vaccination",
      nullableColumn(Sequelize.STRING)
    );

    await queryInterface.sequelize.query("drop type cough.enum_aspren_data_previous_vaccination cascade");

    await queryInterface.changeColumn(
      {
        tableName: "aspren_data",
        schema: schema
      },
      "adeno_result",
      nullableColumn(Sequelize.BOOLEAN)
    );

    await queryInterface.changeColumn(
      {
        tableName: "aspren_data",
        schema: schema
      },
      "b_pertussis_result",
      nullableColumn(Sequelize.BOOLEAN)
    );

    await queryInterface.changeColumn(
      {
        tableName: "aspren_data",
        schema: schema
      },
      "flu_a_result",
      nullableColumn(Sequelize.BOOLEAN)
    );

    await queryInterface.changeColumn(
      {
        tableName: "aspren_data",
        schema: schema
      },
      "flu_b_result",
      nullableColumn(Sequelize.BOOLEAN)
    );

    await queryInterface.changeColumn(
      {
        tableName: "aspren_data",
        schema: schema
      },
      "h1n1_result",
      nullableColumn(Sequelize.BOOLEAN)
    );

    await queryInterface.changeColumn(
      {
        tableName: "aspren_data",
        schema: schema
      },
      "h3n2_result",
      nullableColumn(Sequelize.BOOLEAN)
    );

    await queryInterface.changeColumn(
      {
        tableName: "aspren_data",
        schema: schema
      },
      "metapneumovirus_result",
      nullableColumn(Sequelize.BOOLEAN)
    );

    await queryInterface.changeColumn(
      {
        tableName: "aspren_data",
        schema: schema
      },
      "mycopneumonia_result",
      nullableColumn(Sequelize.BOOLEAN)
    );

    await queryInterface.changeColumn(
      {
        tableName: "aspren_data",
        schema: schema
      },
      "para_1_result",
      nullableColumn(Sequelize.BOOLEAN)
    );

    await queryInterface.changeColumn(
      {
        tableName: "aspren_data",
        schema: schema
      },
      "para_2_result",
      nullableColumn(Sequelize.BOOLEAN)
    );

    await queryInterface.changeColumn(
      {
        tableName: "aspren_data",
        schema: schema
      },
      "para_3_result",
      nullableColumn(Sequelize.BOOLEAN)
    );

    await queryInterface.changeColumn(
      {
        tableName: "aspren_data",
        schema: schema
      },
      "rhinovirus_result",
      nullableColumn(Sequelize.BOOLEAN)
    );

    await queryInterface.changeColumn(
      {
        tableName: "aspren_data",
        schema: schema
      },
      "rsv_result",
      nullableColumn(Sequelize.BOOLEAN)
    );

    await queryInterface.changeColumn(
      {
        tableName: "aspren_data",
        schema: schema
      },
      "victoria_result",
      nullableColumn(Sequelize.BOOLEAN)
    );

    await queryInterface.changeColumn(
      {
        tableName: "aspren_data",
        schema: schema
      },
      "yamagata_result",
      nullableColumn(Sequelize.BOOLEAN)
    );
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.changeColumn(
      {
        tableName: "aspren_data",
        schema: schema
      },
      "atsi",
      nullableColumn(Sequelize.ENUM("AB", "TS", "BT", "U", "N"))
    );

    await queryInterface.changeColumn(
      {
        tableName: "aspren_data",
        schema: schema
      },
      "current_vaccination",
      nullableColumn(Sequelize.ENUM("Y", "N", "U"))
    );

    await queryInterface.changeColumn(
      {
        tableName: "aspren_data",
        schema: schema
      },
      "previous_vaccination",
      nullableColumn(
        Sequelize.ENUM("Y", "N", "U", "NEVER")
      )
    );

    await queryInterface.changeColumn(
      {
        tableName: "aspren_data",
        schema: schema
      },
      "adeno_result",
      column(Sequelize.BOOLEAN)
    );

    await queryInterface.changeColumn(
      {
        tableName: "aspren_data",
        schema: schema
      },
      "b_pertussis_result",
      column(Sequelize.BOOLEAN)
    );

    await queryInterface.changeColumn(
      {
        tableName: "aspren_data",
        schema: schema
      },
      "flu_a_result",
      column(Sequelize.BOOLEAN)
    );

    await queryInterface.changeColumn(
      {
        tableName: "aspren_data",
        schema: schema
      },
      "flu_b_result",
      column(Sequelize.BOOLEAN)
    );

    await queryInterface.changeColumn(
      {
        tableName: "aspren_data",
        schema: schema
      },
      "h1n1_result",
      column(Sequelize.BOOLEAN)
    );

    await queryInterface.changeColumn(
      {
        tableName: "aspren_data",
        schema: schema
      },
      "h3n2_result",
      column(Sequelize.BOOLEAN)
    );

    await queryInterface.changeColumn(
      {
        tableName: "aspren_data",
        schema: schema
      },
      "metapneumovirus_result",
      column(Sequelize.BOOLEAN)
    );

    await queryInterface.changeColumn(
      {
        tableName: "aspren_data",
        schema: schema
      },
      "mycopneumonia_result",
      column(Sequelize.BOOLEAN)
    );

    await queryInterface.changeColumn(
      {
        tableName: "aspren_data",
        schema: schema
      },
      "para_1_result",
      column(Sequelize.BOOLEAN)
    );

    await queryInterface.changeColumn(
      {
        tableName: "aspren_data",
        schema: schema
      },
      "para_2_result",
      column(Sequelize.BOOLEAN)
    );

    await queryInterface.changeColumn(
      {
        tableName: "aspren_data",
        schema: schema
      },
      "para_3_result",
      column(Sequelize.BOOLEAN)
    );

    await queryInterface.changeColumn(
      {
        tableName: "aspren_data",
        schema: schema
      },
      "rhinovirus_result",
      column(Sequelize.BOOLEAN)
    );

    await queryInterface.changeColumn(
      {
        tableName: "aspren_data",
        schema: schema
      },
      "rsv_result",
      column(Sequelize.BOOLEAN)
    );

    await queryInterface.changeColumn(
      {
        tableName: "aspren_data",
        schema: schema
      },
      "victoria_result",
      column(Sequelize.BOOLEAN)
    );

    await queryInterface.changeColumn(
      {
        tableName: "aspren_data",
        schema: schema
      },
      "yamagata_result",
      column(Sequelize.BOOLEAN)
    );
  }
};