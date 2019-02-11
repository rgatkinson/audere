// Copyright (c) 2018 by Audere
//
// Use of this source code is governed by an MIT-style license that
// can be found in the LICENSE file distributed with this file.

import Sequelize from "sequelize";
import "../util/config";

export const sequelizeNonPII = new Sequelize(process.env.NONPII_DATABASE_URL, {
  // This globally enables search path options, if not enabled search path
  // options are deleted from config. This is needed for querying census data.
  dialectOptions: {
    prependSearchPath: true
  },
  logging: false
});

export const sequelizePII = new Sequelize(process.env.PII_DATABASE_URL, {
  logging: false
});