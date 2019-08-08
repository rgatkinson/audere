// Copyright (c) 2019 by Audere
//
// Use of this source code is governed by an MIT-style license that
// can be found in the LICENSE file distributed with this file.

import { Sequelize } from "sequelize";
import { defineModel, Model, stringColumn, unique } from "./sql";

export interface DataNodeAttributes {
  id?: string;
  name: string;
  hash: string;
  cleanup: string;
}
export function defineDataNode(sql: Sequelize): Model<DataNodeAttributes> {
  return defineModel<DataNodeAttributes>(sql, "data_pipeline_nodes", {
    name: unique(stringColumn()),
    hash: stringColumn(),
    cleanup: stringColumn(),
  });
}
