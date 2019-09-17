// Copyright (c) 2019 by Audere
//
// Use of this source code is governed by an MIT-style license that
// can be found in the LICENSE file distributed with this file.

'use strict';

const schema = "cough";
module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.addConstraint({ tableName: 'giftcards', schema }, ['url'], {
      name: 'giftcards_url_key',
      type: 'unique',
    });
  },

  down: (queryInterface, Sequelize) => {
    //return queryInterface.removeConstraint({ tableName: 'giftcards', schema }, 'giftcards_url_key');
    // RemoveConstraint can't handle schemas until we upgrade to sequelize 5.0
    return queryInterface.sequelize.query("ALTER TABLE cough.giftcards DROP CONSTRAINT giftcards_url_key");
  }
};
