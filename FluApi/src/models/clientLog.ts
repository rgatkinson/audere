// Copyright (c) 2019 by Audere
//
// Use of this source code is governed by an MIT-style license that
// can be found in the LICENSE file distributed with this file.

import Sequelize from "sequelize";
import { sequelizeNonPII } from "./";
import { DeviceInfo, LogLevel } from "audere-lib/snifflesProtocol";

interface ClientLogAttributes {
  id?: string;
  log: string;
  level: LogLevel;
  device: DeviceInfo;
}
type ClientLogInstance = Sequelize.Instance<ClientLogAttributes> &
  ClientLogAttributes;

export const ClientLog = sequelizeNonPII.define<
  ClientLogInstance,
  ClientLogAttributes
>("client_logs", {
  log: Sequelize.STRING,
  level: Sequelize.INTEGER,
  device: Sequelize.JSON
});
