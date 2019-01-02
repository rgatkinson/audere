// Copyright (c) 2018 by Audere
//
// Use of this source code is governed by an MIT-style license that
// can be found in the LICENSE file distributed with this file.

import Sequelize from "sequelize";
import { sequelizeCore } from "./";

interface AccessKeyAttributes {
  id?: string;
  key: string;
  valid: boolean;
}
type AccessKeyInstance = Sequelize.Instance<AccessKeyAttributes> &
  AccessKeyAttributes;

export const AccessKey = sequelizeCore.define<
  AccessKeyInstance,
  AccessKeyAttributes
>("access_key", {
  key: {
    allowNull: false,
    type: Sequelize.STRING
  },
  valid: {
    allowNull: false,
    type: Sequelize.BOOLEAN
  }
});
