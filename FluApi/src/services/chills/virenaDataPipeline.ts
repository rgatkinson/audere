// Copyright (c) 2019 by Audere
//
// Use of this source code is governed by an MIT-style license that
// can be found in the LICENSE file distributed with this file.

import {
  DataPipeline,
  ManagedMaterializedView,
  ManagedSqlNode,
} from "../data/dataPipeline";
import { Sequelize } from "sequelize";

export class VirenaDataPipeline implements DataPipeline {
  public readonly name: string;
  public readonly db: Sequelize;
  public readonly nodes: ManagedSqlNode[];

  constructor(sql: Sequelize) {
    this.name = "chills_virena_pipeline";
    this.db = sql;
    let nodes = [];
    nodes = nodes.concat(getDataNodes());
    this.nodes = nodes;
  }
}

function getDataNodes(): ManagedSqlNode[] {
  return [
    new ManagedMaterializedView({
      name: "chills_derived.virena_records",
      deps: [],
      spec: `
        select 
          serial_number,
          test_date,
          facility,
          city,
          state,
          zip,
          patient_age,
          result1,
          result2,
          overall_result,
          county,
          facility_description
        from
          chills.virena_records
      `,
    }),
    new ManagedMaterializedView({
      name: "chills_derived.cdc_clinical",
      deps: [],
      spec: `
        select 
          state,
          year,
          week,
          total_specimens,
          total_a,
          total_b
        from
          chills.cdc_clinical
      `,
    }),
    new ManagedMaterializedView({
      name: "chills_derived.cdc_ilinet",
      deps: [],
      spec: `
        select 
          state,
          year,
          week,
          total_patients,
          providers,
          total_ili
        from
          chills.cdc_ilinet
      `,
    }),
  ];
}
