// Copyright (c) 2018 by Audere
//
// Use of this source code is governed by an MIT-style license that
// can be found in the LICENSE file distributed with this file.

"use strict";

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.sequelize.query(
      `insert into gapless_seq (name, index, "createdAt", "updatedAt")
       values ('Kit_Batch', 0, current_timestamp, current_timestamp)`
    );
    await queryInterface.sequelize.query(
      `insert into gapless_seq (name, index, "createdAt", "updatedAt")
        values ('Kit_Items', 0, current_timestamp, current_timestamp)`
    );
  },
  down: (queryInterface, Sequelize) => {
    return queryInterface.sequelize.query(
      `delete from gapless_seq
       where name in ('Kit_Batch', 'Kit_Items')`
    );
  }
};