// Copyright (c) 2018 by Audere
//
// Use of this source code is governed by an MIT-style license that
// can be found in the LICENSE file distributed with this file.

import Sequelize from "sequelize";
import { sequelizeNonPII } from "./";

export interface HutchUploadAttributes {
  id?: number;
  visitId: number;
}

export type HutchUploadInstance = Sequelize.Instance<HutchUploadAttributes> &
  HutchUploadAttributes;

export const HutchUpload = sequelizeNonPII.define<
  HutchUploadInstance,
  HutchUploadAttributes
>(
  "hutch_upload",
  {
    visitId: {
      field: "visit_id",
      allowNull: false,
      unique: true,
      type: Sequelize.INTEGER
    }
  },
  {
    freezeTableName: true
  }
);
