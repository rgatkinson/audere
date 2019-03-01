// Copyright (c) 2018 by Audere
//
// Use of this source code is governed by an MIT-style license that
// can be found in the LICENSE file distributed with this file.

import {
  defineModel,
  Model,
  SplitSql,
  integerColumn,
  unique,
  stringColumn,
} from "../util/sql"

export interface GaplessSeqAttributes {
  name: string;
  index: number;
}
export type GaplessSeqModel = Model<GaplessSeqAttributes>;
export function defineGaplessSeq(sql: SplitSql): GaplessSeqModel {
  return defineModel<GaplessSeqAttributes>(
    sql.nonPii,
    "gapless_seq",
    {
      name: unique(stringColumn()),
      index: integerColumn(),
    }
  )
}