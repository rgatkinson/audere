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
  nullable,
} from "../../util/sql";
import { Sequelize } from "sequelize";

export interface HutchUploadAttributes {
  id?: number;
  visitId: number;
  surveyId: number;
}

export type HutchUploadModel = Model<HutchUploadAttributes>;

export function defineHutchUpload(sql: SplitSql): HutchUploadModel {
  return defineHutchUploadSequelize(sql.nonPii);
}

export function defineHutchUploadSequelize(
  sequelize: Sequelize
): HutchUploadModel {
  return defineModel<HutchUploadAttributes>(sequelize, "hutch_upload", {
    visitId: nullable(unique(integerColumn("visit_id"))),
    surveyId: nullable(unique(integerColumn("survey_id"))),
  });
}
