// Copyright (c) 2020 by Audere
//
// Use of this source code is governed by an MIT-style license that
// can be found in the LICENSE file distributed with this file.

"use strict";

const { baseColumns, column } = require("../../util");
const schema = "covid";

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.createSchema(schema);

    await queryInterface.createTable(
      "surveys",
      {
        ...baseColumns(Sequelize),
      },
      { schema }
    );

    await queryInterface.createTable(
      "workflow_events",
      {
        ...baseColumns(Sequelize),
      },
      { schema }
    );

    await queryInterface.createTable(
      "import_problems",
      {
        ...baseColumns(Sequelize),
        firebase_id: column(Sequelize.STRING),
        firebase_collection: column(Sequelize.STRING),
        attempts: column(Sequelize.INTEGER),
        last_error: column(Sequelize.TEXT)
      },
      { schema }
    );
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.dropTable("surveys", { schema });
    await queryInterface.dropTable("workflow_events", { schema });
    await queryInterface.dropTable("import_problems", { schema });
    await queryInterface.dropSchema(schema);
  },
};
