// Copyright (c) 2020 by Audere
//
// Use of this source code is governed by an MIT-style license that
// can be found in the LICENSE file distributed with this file.

import { DataPipeline, ManagedSqlNode } from "../data/dataPipeline";
import { Sequelize } from "sequelize";

export class CovidDataPipeline implements DataPipeline {
  public readonly name: string;
  public readonly db: Sequelize;
  public readonly nodes: ManagedSqlNode[];

  constructor(sql: Sequelize) {}
}
