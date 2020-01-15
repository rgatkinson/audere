// Copyright (c) 2020 by Audere
//
// Use of this source code is governed by an MIT-style license that
// can be found in the LICENSE file distributed with this file.

'use strict';

const { nullableColumn } = require("../../util");
const schema = "chills";

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.removeColumn(
      { tableName: "mtl_reports", schema },
      "order_number"
    );

    await queryInterface.removeColumn(
      { tableName: "mtl_reports", schema },
      "user_gender"
    );

    await queryInterface.removeColumn(
      { tableName: "mtl_reports", schema },
      "user_birthdate"
    );

    await queryInterface.removeColumn(
      { tableName: "mtl_reports", schema },
      "user_email"
    );

    await queryInterface.removeColumn(
      { tableName: "mtl_reports", schema },
      "user_phone"
    );

    await queryInterface.removeColumn(
      { tableName: "mtl_reports", schema },
      "user_first_name"
    );

    await queryInterface.removeColumn(
      { tableName: "mtl_reports", schema },
      "user_last_name"
    );

    await queryInterface.removeColumn(
      { tableName: "mtl_reports", schema },
      "user_zip_code"
    );

    await queryInterface.removeColumn(
      { tableName: "mtl_reports", schema },
      "flu_a_snp"
    );

    await queryInterface.removeColumn(
      { tableName: "mtl_reports", schema },
      "flu_b_snp"
    );

    await queryInterface.removeColumn(
      { tableName: "mtl_reports", schema },
      "rsv_snp"
    );
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.addColumn(
      { tableName: "mtl_reports", schema },
      'order_number',
      { ...nullableColumn(Sequelize.STRING) }
    );

    await queryInterface.addColumn(
      { tableName: "mtl_reports", schema },
      'flu_a_snp',
      { ...nullableColumn(Sequelize.STRING) }
    );

    await queryInterface.addColumn(
      { tableName: "mtl_reports", schema },
      'flu_b_snp',
      { ...nullableColumn(Sequelize.STRING) }
    );

    await queryInterface.addColumn(
      { tableName: "mtl_reports", schema },
      'rsv_snp',
      { ...nullableColumn(Sequelize.STRING) }
    );

    await queryInterface.addColumn(
      { tableName: "mtl_reports", schema },
      'user_gender',
      { ...nullableColumn(Sequelize.STRING) }
    );

    await queryInterface.addColumn(
      { tableName: "mtl_reports", schema },
      'user_birthdate',
      { ...nullableColumn(Sequelize.STRING) }
    );

    await queryInterface.addColumn(
      { tableName: "mtl_reports", schema },
      'user_email',
      { ...nullableColumn(Sequelize.STRING) }
    );

    await queryInterface.addColumn(
      { tableName: "mtl_reports", schema },
      'user_phone',
      { ...nullableColumn(Sequelize.STRING) }
    );

    await queryInterface.addColumn(
      { tableName: "mtl_reports", schema },
      'user_first_name',
      { ...nullableColumn(Sequelize.STRING) }
    );

    await queryInterface.addColumn(
      { tableName: "mtl_reports", schema },
      'user_last_name',
      { ...nullableColumn(Sequelize.STRING) }
    );

    await queryInterface.addColumn(
      { tableName: "mtl_reports", schema },
      'user_zip_code',
      { ...nullableColumn(Sequelize.STRING) }
    );
  }
};