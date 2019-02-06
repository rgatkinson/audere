// Copyright (c) 2018 by Audere
//
// Use of this source code is governed by an MIT-style license that
// can be found in the LICENSE file distributed with this file.

import Sequelize from "sequelize";
import { sequelizeNonPII } from "./";
import { DeviceInfo } from "audere-lib/snifflesProtocol";

interface FeedbackAttributes {
  id?: string;
  subject: string;
  body: string;
  device: DeviceInfo;
}
type FeedbackInstance = Sequelize.Instance<FeedbackAttributes> &
  FeedbackAttributes;

export const Feedback = sequelizeNonPII.define<
  FeedbackInstance,
  FeedbackAttributes
>(
  "feedback",
  {
    subject: Sequelize.STRING,
    body: Sequelize.STRING,
    device: Sequelize.JSON
  },
  {
    freezeTableName: true
  }
);
