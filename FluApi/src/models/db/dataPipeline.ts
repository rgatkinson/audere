// Copyright (c) 2019 by Audere
//
// Use of this source code is governed by an MIT-style license that
// can be found in the LICENSE file distributed with this file.

import { Sequelize } from "sequelize";
import {
  defineModel,
  Model,
  SplitSql,
  stringColumn,
  unique,
} from "../../util/sql";

export function defineDataFlowModels(sql: SplitSql): DataFlowModels {
  const models: DataFlowModels = {
    node: defineDataNode(sql.nonPii),
    pipeline: defineDataPipeline(sql.nonPii),
  };

  return models;
}

export interface DataFlowModels {
  node: Model<DataNodeAttributes>;
  pipeline: Model<DataPipelineAttributes>;
}

export interface DataNodeAttributes {
  id?: string;
  name: string;
  hash: string;
  cleanup: string;
  pipeline: string;
}
export function defineDataNode(sql: Sequelize): Model<DataNodeAttributes> {
  return defineModel<DataNodeAttributes>(sql, "data_pipeline_nodes", {
    name: unique(stringColumn()),
    hash: stringColumn(),
    cleanup: stringColumn(),
    pipeline: stringColumn(),
  });
}

export interface DataPipelineAttributes {
  id?: string;
  name: string;
}
export function defineDataPipeline(
  sql: Sequelize
): Model<DataPipelineAttributes> {
  return defineModel<DataPipelineAttributes>(sql, "data_pipelines", {
    name: unique(stringColumn()),
  });
}
