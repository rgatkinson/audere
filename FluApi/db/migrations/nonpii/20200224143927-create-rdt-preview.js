// Copyright (c) 2020 by Audere
//
// Use of this source code is governed by an MIT-style license that
// can be found in the LICENSE file distributed with this file.

"use strict";

const { baseColumns, column, nullableColumn } = require("../../util");
const schema = "chills";

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.createTable(
      "rdt_preview_frames",
      {
        ...baseColumns(Sequelize),
        docid: column(Sequelize.STRING),
        series_index: column(Sequelize.INTEGER),
        frame_index: column(Sequelize.INTEGER),
        preview_sample_rate: column(Sequelize.INTEGER),
        ui_message: nullableColumn(Sequelize.STRING),
        failure_reason: nullableColumn(Sequelize.STRING),
        photo_uploaded: nullableColumn(Sequelize.BOOLEAN),
        preview_photo_id: nullableColumn(Sequelize.STRING),
        is_focused: nullableColumn(Sequelize.BOOLEAN),
        is_steady: nullableColumn(Sequelize.BOOLEAN),
        is_centered: nullableColumn(Sequelize.BOOLEAN),
        test_strip_detected: nullableColumn(Sequelize.BOOLEAN),
        control_line_found: nullableColumn(Sequelize.BOOLEAN),
        test_a_line_found: nullableColumn(Sequelize.BOOLEAN),
        test_b_line_found: nullableColumn(Sequelize.BOOLEAN),
        ssharpness_raw: nullableColumn(Sequelize.FLOAT),
        exposure_result: nullableColumn(Sequelize.INTEGER),
        phase_1_recognitions: nullableColumn(Sequelize.STRING),
        phase_2_recognitions: nullableColumn(Sequelize.STRING),
        intermediate_results: nullableColumn(Sequelize.STRING),
        test_strip_boundary: nullableColumn(Sequelize.STRING),
      },
      { schema }
    );
    return queryInterface.addConstraint(
      { tableName: "rdt_preview_frames", schema },
      ["docid", "series_index", "frame_index"],
      {
        name: "docid_series_frame_unique",
        type: "UNIQUE",
      }
    );
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.removeConstraint(
      { tableName: "rdt_preview_frames", schema },
      ["docid", "series_index", "frame_index"],
      {
        name: "docid_series_frame_unique",
        type: "UNIQUE",
      }
    );
    await queryInterface.dropTable("rdt_preview_frames", { schema });
  },
};
