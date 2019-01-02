// Copyright (c) 2018 by Audere
//
// Use of this source code is governed by an MIT-style license that
// can be found in the LICENSE file distributed with this file.

import Sequelize from "sequelize";
import { sequelizeCore, sequelizeIdentity } from "./";
import { VisitCoreInfo, VisitIdentityInfo, } from "audere-lib";

interface VisitCoreAttributes {
  id?: string;
  csruid: string;
  device: object;
  visit: VisitCoreInfo;
}
type VisitCoreInstance = Sequelize.Instance<VisitCoreAttributes> & VisitCoreAttributes;

export const VisitCore = sequelizeCore.define<VisitCoreInstance, VisitCoreAttributes>(
  "visit_core",
  {
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
  }
);


interface VisitIdentityAttributes {
  id?: string;
  csruid: string;
  device: object;
  visit: VisitIdentityInfo;
}
type VisitIdentityInstance = Sequelize.Instance<VisitIdentityAttributes> & VisitIdentityAttributes;

export const VisitIdentity = sequelizeIdentity.define<VisitIdentityInstance, VisitIdentityAttributes>(
  "visit_identity",
  {
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
  }
);
