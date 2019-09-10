// Copyright (c) 2019 by Audere
//
// Use of this source code is governed by an MIT-style license that
// can be found in the LICENSE file distributed with this file.

"use strict";

const { baseColumns, column, unique } = require("../../util");
const schema = "cough";

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.createTable(
      "follow_up_survey_files",
      {
        ...baseColumns(Sequelize),
        key: unique(column(Sequelize.STRING)),
        hash: column(Sequelize.STRING)
      },
      { schema }
    );

    await queryInterface.createTable(
      "follow_up_surveys",
      {
        ...baseColumns(Sequelize),
        startDate: column(Sequelize.STRING),
        endDate: column(Sequelize.STRING),
        status: column(Sequelize.STRING),
        progress: column(Sequelize.STRING),
        duration: column(Sequelize.STRING),
        finished: column(Sequelize.STRING),
        recordedDate: column(Sequelize.STRING),
        responseId: unique(column(Sequelize.STRING)),
        externalDataReference: column(Sequelize.STRING),
        distributionChannel: column(Sequelize.STRING),
        userLanguage: column(Sequelize.STRING),
        QID12: column(Sequelize.STRING),
        QID15: column(Sequelize.STRING),
        QID9: column(Sequelize.STRING),
        QID17: column(Sequelize.STRING),
        QID6: column(Sequelize.STRING),
        QID59: column(Sequelize.STRING),
        QID16: column(Sequelize.STRING),
        QID8: column(Sequelize.STRING),
        QID14: column(Sequelize.STRING),
        QID23: column(Sequelize.STRING),
        QID22: column(Sequelize.STRING),
        QID20: column(Sequelize.STRING),
        QID21: column(Sequelize.STRING),
        QID24: column(Sequelize.STRING),
        QID33_1: column(Sequelize.STRING),
        QID33_2: column(Sequelize.STRING),
        QID33_3: column(Sequelize.STRING),
        QID33_7: column(Sequelize.STRING),
        QID42: column(Sequelize.STRING),
        QID34: column(Sequelize.STRING),
        QID43: column(Sequelize.STRING),
        QID58: column(Sequelize.STRING),
        QID31: column(Sequelize.STRING),
        QID46: column(Sequelize.STRING),
        QID30: column(Sequelize.STRING),
        QID41: column(Sequelize.STRING),
        QID44: column(Sequelize.STRING),
        QID47_1_1: column(Sequelize.STRING),
        QID47_1_2: column(Sequelize.STRING),
        QID47_1_3: column(Sequelize.STRING),
        QID47_1_4: column(Sequelize.STRING),
        QID35: column(Sequelize.STRING),
        QID61: column(Sequelize.STRING),
        QID45: column(Sequelize.STRING),
        QID28: column(Sequelize.STRING),
        QID62: column(Sequelize.STRING),
        QID63: column(Sequelize.STRING)
      },
      { schema }
    );
  },
  down: async (queryInterface, Sequelize) => {
    await queryInterface.dropTable("follow_up_survey_files", { schema });
    await queryInterface.dropTable("follow_up_surveys", { schema });
  }
};
