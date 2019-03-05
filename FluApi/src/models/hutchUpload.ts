// Copyright (c) 2018 by Audere
//
// Use of this source code is governed by an MIT-style license that
// can be found in the LICENSE file distributed with this file.

import {
  defineModel,
  Model,
  SplitSql,
  integerColumn,
  unique
} from "../util/sql";

export interface HutchUploadAttributes {
  id?: number;
  visitId: number;
}
export type HutchUploadModel = Model<HutchUploadAttributes>;
export function defineHutchUpload(sql: SplitSql): HutchUploadModel {
  return defineModel<HutchUploadAttributes>(sql.nonPii, "hutch_upload", {
    visitId: unique(integerColumn("visit_id"))
  });
}
