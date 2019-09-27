'use strict';

const models = require('../../../build/src/endpoints/webPortal/models.js');
const auth = require('../../../build/src/endpoints/webPortal/auth.js');

module.exports = {
  up: async (queryInterface, Sequelize) => {
    const user = models.defineUser({pii: queryInterface.sequelize});
    const permission = models.definePermissions({pii: queryInterface.sequelize});
    const users = await user.findAll();
    await Promise.all(users.map(async u => {
      await permission.create({
        userId: u.id,
        permission: auth.Permission.SNIFFLES_METRICS_ACCESS
      });
      await permission.create({
        userId: u.id,
        permission: auth.Permission.FEVER_METRICS_ACCESS
      });
    }));
  },

  down: async (queryInterface, Sequelize) => {
    const user = models.defineUser({pii: queryInterface.sequelize});
    const permission = models.definePermissions({pii: queryInterface.sequelize});
    const users = await user.findAll();
    await Promise.all(users.map(async u => {
      await permission.destroy({
        where: {
          userId: u.id,
          permission: auth.Permission.SNIFFLES_METRICS_ACCESS
        }
      });
      await permission.destroy({
        where: {
          userId: u.id,
          permission: auth.Permission.FEVER_METRICS_ACCESS
        }
      });
    }));
  }
};
