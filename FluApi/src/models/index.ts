// Copyright (c) 2018 by Audere
//
// Use of this source code is governed by an MIT-style license that
// can be found in the LICENSE file distributed with this file.

import fs from "fs";
import path from "path";
import Sequelize from "sequelize";
import "../util/config";
import sequelizeLogger from "sequelize-log-syntax-colors";

export const sequelizeCore = new Sequelize(process.env.NONPII_DATABASE_URL, {
  logging: (str: string) => console.log(sequelizeLogger(str))
});

export const sequelizeIdentity = new Sequelize(process.env.PII_DATABASE_URL, {
  logging: (str: string) => console.log(sequelizeLogger(str))
});
