// Copyright (c) 2019 by Audere
//
// Use of this source code is governed by an MIT-style license that
// can be found in the LICENSE file distributed with this file.

"use strict";

const { baseColumns, column, nullableColumn, unique } = require("../../util");
const schema = "chills";

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.createTable(
      "mtl_files",
      {
        ...baseColumns(Sequelize),
        key: unique(column(Sequelize.STRING)),
        hash: column(Sequelize.STRING),
      },
      { schema }
    );

    await queryInterface.createTable(
      "mtl_reports",
      {
        ...baseColumns(Sequelize),
        order_id: unique(column(Sequelize.STRING)),
        shipped: {
          ...column(Sequelize.BOOLEAN),
          defaultValue: false
        },
        received: {
          ...column(Sequelize.BOOLEAN),
          defaultValue: false
        },
        processed: {
          ...column(Sequelize.BOOLEAN),
          defaultValue: false
        },
        rejected: {
          ...column(Sequelize.BOOLEAN),
          defaultValue: false
        },
        order_number: nullableColumn(Sequelize.STRING),
        evidation_id: nullableColumn(Sequelize.STRING),
        outbound_barcode: nullableColumn(Sequelize.STRING),
        inbound_barcode: nullableColumn(Sequelize.STRING),
        shipped_timestamp: nullableColumn(Sequelize.STRING),
        kit_registration_code: nullableColumn(Sequelize.STRING),
        user_gender: nullableColumn(Sequelize.STRING),
        user_birthdate: nullableColumn(Sequelize.STRING),
        user_email: nullableColumn(Sequelize.STRING),
        user_phone: nullableColumn(Sequelize.STRING),
        user_first_name: nullableColumn(Sequelize.STRING),
        user_last_name: nullableColumn(Sequelize.STRING),
        user_zip_code: nullableColumn(Sequelize.STRING),
        strip_temp_status: nullableColumn(Sequelize.STRING),
        rejection_reason: nullableColumn(Sequelize.STRING),
        flu_a_result: nullableColumn(Sequelize.BOOLEAN),
        flu_a_value: nullableColumn(Sequelize.FLOAT),
        flu_a_snp: nullableColumn(Sequelize.STRING),
        flu_a_assay_timestamp: nullableColumn(Sequelize.STRING),
        flu_b_result: nullableColumn(Sequelize.BOOLEAN),
        flu_b_value: nullableColumn(Sequelize.FLOAT),
        flu_b_snp: nullableColumn(Sequelize.STRING),
        flu_b_assay_timestamp: nullableColumn(Sequelize.STRING),
        rsv_result: nullableColumn(Sequelize.BOOLEAN),
        rsv_value: nullableColumn(Sequelize.FLOAT),
        rsv_snp: nullableColumn(Sequelize.STRING),
        rsv_assay_timestamp: nullableColumn(Sequelize.STRING)
      },
      { schema }
    );
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.dropTable("mtl_files", { schema });
    await queryInterface.dropTable("mtl_reports", { schema });
  }
};
