// Copyright (c) 2019 by Audere
//
// Use of this source code is governed by an MIT-style license that
// can be found in the LICENSE file distributed with this file.

import { Sequelize } from "sequelize";
import {
  defineModel,
  Model,
  bigIntColumn,
  jsonbColumn,
  stringColumn,
  unique,
} from "../sql/sql";

const schema = "cough";

export interface AnalyticsModels {
  analytics: Model<FirebaseAnalyticsAttributes>;
  analyticsTables: Model<FirebaseAnalyticsTableAttributes>;
}

export interface FirebaseAnalyticsAttributes {
  event_date: string;
  event: any;
}
export function defineFirebaseAnalytics(
  sql: Sequelize
): Model<FirebaseAnalyticsAttributes> {
  return defineModel<FirebaseAnalyticsAttributes>(
    sql,
    "firebase_analytics",
    {
      event_date: stringColumn(),
      event: jsonbColumn(),
    },
    { schema }
  );
}

export interface FirebaseAnalyticsTableAttributes {
  name: string;
  modified: number;
}
export function defineFirebaseAnalayticsTable(
  sql: Sequelize
): Model<FirebaseAnalyticsTableAttributes> {
  return defineModel<FirebaseAnalyticsTableAttributes>(
    sql,
    "firebase_analytics_table",
    {
      name: unique(stringColumn()),
      modified: bigIntColumn(),
    },
    { schema }
  );
}
