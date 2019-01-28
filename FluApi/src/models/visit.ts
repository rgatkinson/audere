// Copyright (c) 2018 by Audere
//
// Use of this source code is governed by an MIT-style license that
// can be found in the LICENSE file distributed with this file.

import sequelize, { Model, Sequelize } from "sequelize";
import { sequelizeNonPII, sequelizePII } from "./";
import { DeviceInfo, VisitNonPIIInfo, VisitPIIInfo } from "audere-lib";

export enum VisitTableType {
  CURRENT = "visit",
  BACKUP = "visit_backup",
}

// Visits are split across two databases.  One contains PII and the
// other contains all the rest of the data.  The database schema is
// identical, but we create two separate TypeScript types to help
// keep things straight.

export enum VisitFilterType {
  PII = "PII",
  NonPII = "NON_PII"
}

export const VisitNonPII = defineSqlVisit<VisitNonPIIInfo>(sequelizeNonPII);
export type VisitNonPIIInstance = VisitInstance<VisitNonPIIInfo>;
export type VisitNonPIIAttributes = VisitAttributes<VisitNonPIIInfo>;

export const VisitPII = defineSqlVisit<VisitPIIInfo>(sequelizePII);
export type VisitPIIInstance = VisitInstance<VisitPIIInfo>;
export type VisitPIIAttributes = VisitAttributes<VisitPIIInfo>;

export interface VisitAttributes<Visit> {
  id?: string;
  csruid: string;
  device: DeviceInfo;
  visit: Visit;
}

export type VisitInstance<Visit> =
  sequelize.Instance<VisitAttributes<Visit>> & VisitAttributes<Visit>;

export type VisitModel<T> = Model<VisitInstance<T>, VisitAttributes<T>>;

export function defineSqlVisit<Visit>(sql: Sequelize, tableType = VisitTableType.CURRENT): Model<VisitInstance<Visit>, VisitAttributes<Visit>> {
  // The sequelize type definition makes define return Model<any,any>, so cast to recover type info.
  return <VisitModel<Visit>><any>sql.define<VisitInstance<Visit>, VisitAttributes<Visit>>(
    tableType,
    {
      csruid: {
        allowNull: false,
        ...(tableType === "visit" ? { unique: true } : {}),
        type: sequelize.STRING,
      },
      device: {
        allowNull: false,
        type: sequelize.JSON,
      },
      visit: {
        allowNull: false,
        type: sequelize.JSON,
      }
    },
    {}
  );
}
