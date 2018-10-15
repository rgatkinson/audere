import fs from 'fs';
import path from 'path';
import Sequelize from 'sequelize';
import '../util/config';
import sequelizeLogger from 'sequelize-log-syntax-colors';

export const sequelize = new Sequelize(process.env.DATABASE_URL, {
  logging: (str: string) => console.log(sequelizeLogger(str))
});
