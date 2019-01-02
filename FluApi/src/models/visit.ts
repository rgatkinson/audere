// Copyright (c) 2018 by Audere
//
// Use of this source code is governed by an MIT-style license that
// can be found in the LICENSE file distributed with this file.

import Sequelize from "sequelize";
import { sequelizeNonPII, sequelizePII } from "./";
import { VisitNonPIIInfo, VisitPIIInfo } from "audere-lib";

// Visits are split across two databases.  One contains PII and the
// other contains all the rest of the data.  The database schema is
// identical, but we create two separate TypeScript types to help
// keep things straight.

export enum VisitFilterType {
  PII = "PII",
  NonPII = "NON_PII"
}

interface VisitNonPIIAttributes {
  id?: string;
  csruid: string;
  device: object;
  visit: VisitNonPIIInfo;
}

type VisitNonPIIInstance = Sequelize.Instance<VisitNonPIIAttributes> &
  VisitNonPIIAttributes;

export const VisitNonPII = sequelizeNonPII.define<
  VisitNonPIIInstance,
  VisitNonPIIAttributes
>("visit", {
  csruid: {
    allowNull: false,
    unique: true,
    type: Sequelize.STRING
  },
  device: {
    allowNull: false,
    type: Sequelize.JSON
  },
  visit: {
    allowNull: false,
    type: Sequelize.JSON
  }
});

interface VisitPIIAttributes {
  id?: string;
  csruid: string;
  device: object;
  visit: VisitPIIInfo;
}

type VisitPIIInstance = Sequelize.Instance<VisitPIIAttributes> &
  VisitPIIAttributes;

export const VisitPII = sequelizePII.define<
  VisitPIIInstance,
  VisitPIIAttributes
>("visit", {
  csruid: {
    allowNull: false,
    unique: true,
    type: Sequelize.STRING
  },
  device: {
    allowNull: false,
    type: Sequelize.JSON
  },
  visit: {
    allowNull: false,
    type: Sequelize.JSON
  }
});
