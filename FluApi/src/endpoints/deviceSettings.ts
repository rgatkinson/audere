// Copyright (c) 2019 by Audere
//
// Use of this source code is governed by an MIT-style license that
// can be found in the LICENSE file distributed with this file.

import { SplitSql } from "../util/sql";
import { Model } from "../util/sql";
import { DeviceSettingAttributes, defineDeviceSetting } from "../models/db/devices";
import logger from "../util/logger";

export class DeviceSettingsEndpoint {
  deviceFlag: Model<DeviceSettingAttributes>;

  constructor(sql: SplitSql) {
    this.deviceFlag = defineDeviceSetting(sql);
  }

  async getSetting(req, res) {
    const {device, key} = req.params;
    const rows = await this.deviceFlag.findAll({
      where: {
        device,
        key,
      }
    });

    console.log(`getSetting(${device}, ${key})`);
    switch (rows.length) {
      case 0:
        res.status(404).send("Not found");
        break;

      case 1: {
        const setting = rows[0].setting;
        logger.info(`Returning setting ${device}[${key}] = '${setting}'`);
        res.status(200).send(setting);
        break;
      }

      default:
        logger.error(`Multiple device settings for ${device}[${key}]`);
        res.status(404).send("Multiple entries");
        break;
    }
  }
}
