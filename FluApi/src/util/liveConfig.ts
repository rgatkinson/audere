// Copyright (c) 2019 by Audere
//
// Use of this source code is governed by an MIT-style license that
// can be found in the LICENSE file distributed with this file.

import { Model, SplitSql } from "./sql";
import {
  defineConfigModel,
  ConfigAttributes,
  Project,
} from "../models/db/config";

export { Project } from "../models/db/config";

export class LiveConfig<ConfigAttrs> {
  private readonly configModel: Model<ConfigAttributes>;
  private readonly project: Project;

  constructor(sql: SplitSql, project: Project) {
    this.configModel = defineConfigModel(sql);
    this.project = project;
  }

  public async get<K extends Extract<keyof ConfigAttrs, string>>(
    key: K,
    defaultValue: ConfigAttrs[K] = null
  ): Promise<ConfigAttrs[K]> {
    const record = await this.configModel.findOne({
      where: { project: this.project, key },
    });

    if (record) {
      return record.value;
    } else {
      return defaultValue;
    }
  }

  public async set<K extends Extract<keyof ConfigAttrs, string>>(
    key: K,
    value: ConfigAttrs[K]
  ) {
    this.configModel.upsert({
      project: this.project,
      key,
      value,
    });
  }
}
