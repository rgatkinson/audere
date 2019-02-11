// Copyright (c) 2018 by Audere
//
// Use of this source code is governed by an MIT-style license that
// can be found in the LICENSE file distributed with this file.

import Sequelize from "sequelize";
import { sequelizeNonPII } from "./";

interface SecretAttributes {
  id?: number;
  key: string;
  value: string;
}
type SecretInstance = Sequelize.Instance<SecretAttributes> &
  SecretAttributes;

export const Secrets = sequelizeNonPII.define<
  SecretInstance,
  SecretAttributes
>("secrets", {
  key: Sequelize.STRING,
  value: Sequelize.STRING
});