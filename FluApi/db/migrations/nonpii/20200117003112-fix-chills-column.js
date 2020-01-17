// Copyright (c) 2019 by Audere
//
// Use of this source code is governed by an MIT-style license that
// can be found in the LICENSE file distributed with this file.

'use strict';

const schema = "chills";

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.renameColumn({ schema, tableName: "photo_upload_log" }, "cough_survey_id", "chills_survey_id");
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.renameColumn({ schema, tableName: "photo_upload_log" }, "chills_survey_id", "cough_survey_id");
  }
};
