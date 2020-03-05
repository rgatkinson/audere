// Copyright (c) 2020 by Audere
//
// Use of this source code is governed by an MIT-style license that
// can be found in the LICENSE file distributed with this file.

import {
  DataPipeline,
  ManagedMaterializedView,
  ManagedSqlNode,
} from "../data/dataPipeline";
import { Sequelize } from "sequelize";

export class CovidDataPipeline implements DataPipeline {
  public readonly name: string;
  public readonly db: Sequelize;
  public readonly nodes: ManagedSqlNode[];

  constructor(sql: Sequelize) {
    this.name = "covid_pipeline";
    this.db = sql;
    let nodes = [];
    nodes = nodes.concat(getNonPiiDataNodes());
    this.nodes = nodes;
  }
}

function getNonPiiDataNodes(): ManagedSqlNode[] {
  return [
    new ManagedMaterializedView({
      name: "covid_derived.surveys",
      deps: [],
      spec: `
        select
          c.id,
          c."createdAt",
          c."updatedAt",
          c.uid,
          c.phone,

          c.survey,
          c.survey->'address'->'line' as address_line,
          c.survey->'address'->'city' as address_city,
          c.survey->'address'->'state' as address_state,
          c.survey->'address'->'postalCode' as address_zip,
          c.survey->'address'->'country' as address_country,
          c.survey->'symptoms'->'cough' as cough,
          c.survey->'symptoms'->'fever' as fever
        from
          chills.surveys c
      `,
    }),
    new ManagedMaterializedView({
      name: "covid_derived.workflow_events",
      deps: [],
      spec: `
        select
          w.id,
          w.event_type,
          w.timestamp
        from
          chills.workflow_events w
      `,
    }),
  ];
}
