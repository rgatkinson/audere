// Copyright (c) 2019 by Audere
//
// Use of this source code is governed by an MIT-style license that
// can be found in the LICENSE file distributed with this file.

import {
  defineModel,
  Model,
  SplitSql,
  stringColumn,
  unique,
} from "backend-lib";

export interface DeviceSettingAttributes {
  id?: string;
  device: string;
  key: string;
  setting: string;
}
export function defineDeviceSetting(
  sql: SplitSql
): Model<DeviceSettingAttributes> {
  return defineModel<DeviceSettingAttributes>(sql.nonPii, "device_settings", {
    device: unique(stringColumn(), "device_key_unique"),
    key: unique(stringColumn(), "device_key_unique"),
    setting: stringColumn(),
  });
}
