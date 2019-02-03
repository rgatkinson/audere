// Copyright (c) 2018 by Audere
//
// Use of this source code is governed by an MIT-style license that
// can be found in the LICENSE file distributed with this file.

import sequelize from "sequelize";
import { sequelizeNonPII } from "./";
import { DeviceInfo, LogBatchInfo } from "audere-lib";

export interface LogBatchAttributes {
  id?: string;
  csruid: string;
  device: DeviceInfo;
  batch: LogBatchInfo;
}

export type LogBatchInstance =
  sequelize.Instance<LogBatchAttributes> & LogBatchAttributes;

export const ClientLogBatch = sequelizeNonPII.define<LogBatchInstance, LogBatchAttributes>(
  "sniffles_client_log_batches",
  {
    csruid: {
      allowNull: false,
      unique: true,
      type: sequelize.STRING,
    },
    device: {
      allowNull: false,
      type: sequelize.JSON,
    },
    batch: {
      allowNull: false,
      type: sequelize.JSON,
    },
  },
  {
    freezeTableName: true
  }
);
