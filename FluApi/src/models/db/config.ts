// Copyright (c) 2019 by Audere
//
// Use of this source code is governed by an MIT-style license that
// can be found in the LICENSE file distributed with this file.

import { Sequelize } from "sequelize";
import {
  Model,
  SplitSql,
  defineModel,
  jsonbColumn,
  stringColumn,
  unique,
} from "../../util/sql";

export enum Project {
  SNIFFLES = "sniffles",
  FEVER = "fever",
  COUGH = "cough",
  RASH = "rash",
  CHILLS = "chills",
}

export interface ConfigAttributes {
  project: Project;
  key: string;
  value: any;
}

export function defineConfigModel(sql: SplitSql): Model<ConfigAttributes> {
  return defineModel<ConfigAttributes>(sql.nonPii, "config", {
    project: unique(stringColumn("project"), "config_unique_project_key"),
    key: unique(stringColumn("key"), "config_unique_project_key"),
    value: jsonbColumn("value"),
  });
}
