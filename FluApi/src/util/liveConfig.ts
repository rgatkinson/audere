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

export class LiveConfig {
  private readonly configModel: Model<ConfigAttributes>;
  private readonly project: Project;

  constructor(sql: SplitSql, project: Project) {
    this.configModel = defineConfigModel(sql);
    this.project = project;
  }

  public async get<T>(key: string, defaultValue: T = null): Promise<T> {
    const record = await this.configModel.findOne({
      where: { project: this.project, key },
    });

    if (record) {
      return record.value as T;
    } else {
      return defaultValue;
    }
  }

  public async set<T>(key: string, value: T) {
    this.configModel.upsert({
      project: this.project,
      key,
      value,
    });
  }
}
