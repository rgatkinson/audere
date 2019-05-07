// Copyright (c) 2019 by Audere
//
// Use of this source code is governed by an MIT-style license that
// can be found in the LICENSE file distributed with this file.

"use strict";

module.exports = {
  up: (queryInterface, Sequelize) => {
    return queryInterface.removeConstraint(
      "fever_backup_surveys",
      "fever_backup_surveys_csruid_key",
      {}
    );
  },

  down: (queryInterface, Sequelize) => {
    return queryInterface.addConstraint("fever_backup_surveys", ["csruid"], {
      type: "unique",
      name: "fever_backup_surveys_csruid_key"
    });
  }
};
