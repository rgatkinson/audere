// Copyright (c) 2019 by Audere
//
// Use of this source code is governed by an MIT-style license that
// can be found in the LICENSE file distributed with this file.

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.addColumn("hutch_upload", "survey_id", {
      allowNull: true,
      unique: true,
      type: Sequelize.INTEGER,
      references: {
        model: "fever_current_surveys",
        key: "id",
        as: "surveyId"
      },
      onDelete: "CASCADE"
    });

    await queryInterface.changeColumn("hutch_upload", "visit_id", {
      allowNull: true,
      unique: true,
      type: Sequelize.INTEGER,
      onDelete: "CASCADE"
    });

    await queryInterface.addConstraint(
      "hutch_upload",
      ["survey_id", "visit_id"],
      {
        type: "check",
        name: "survey_or_visit_constraint",
        where: {
          [Sequelize.Op.and]: [
            Sequelize.literal("(survey_id is null) != (visit_id is null)")
          ]
        }
      }
    );
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.removeConstraint(
      "hutch_upload",
      "survey_or_visit_constraint"
    );

    await queryInterface.removeColumn("hutch_upload", "survey_id");

    await queryInterface.changeColumn("hutch_upload", "visit_id", {
      allowNull: false,
      unique: true,
      type: Sequelize.INTEGER,
      onDelete: "CASCADE"
    });
  }
};
