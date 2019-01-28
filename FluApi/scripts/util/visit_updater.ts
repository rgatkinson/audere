// Copyright (c) 2018 by Audere
//
// Use of this source code is governed by an MIT-style license that
// can be found in the LICENSE file distributed with this file.

import Sequelize, {Model} from "sequelize";
import { defineSqlVisit, VisitAttributes, VisitInstance, VisitTableType } from "../../src/models/visit";
import _ from "lodash";

import { DeviceInfo } from "audere-lib";

import { idtxt, ScriptLogger } from "./logger";

const Op = Sequelize.Op;

type VisitModel<T> = Model<VisitInstance<T>, VisitAttributes<T>>;

export class VisitUpdater<T extends object> {
  private readonly data: VisitModel<T>;
  private readonly backup: VisitModel<T>;
  private readonly log: ScriptLogger;
  private readonly label: string;

  constructor(sequelize: Sequelize.Sequelize, log: ScriptLogger, label: string) {
    this.data = defineSqlVisit(sequelize);
    this.backup = defineSqlVisit(sequelize, VisitTableType.BACKUP);
    this.log = log;
    this.label = label;
  }

  async load(key: string): Promise<VisitInstance<T>> {
    return this._load(key, this.data);
  }

  async loadBackup(key: string): Promise<VisitInstance<T>> {
    return this._load(key, this.backup);
  }

  async _load(key: string, model: VisitModel<T>): Promise<VisitInstance<T>> {
    this.log.info(`Loading ${this.label} row for key '${idtxt(key)}'.`);
    const rows = /^[0-9]+$/.test(key)
      ? await model.findAll({ where: { id: key }})
      : await model.findAll({ where: { csruid: { [Op.like]: `${key}%` }}});
    return this.expectOneMatch(key, rows);
  }

  async updateVisit(current: VisitInstance<T>, update: T): Promise<boolean> {
    const { csruid, device } = current;
    return this.update(current, { csruid, device, visit: update }
    );
  }

  async updateDevice(current: VisitInstance<T>, update: DeviceInfo): Promise<boolean> {
    const { csruid, visit } = current;
    return this.update(current, { csruid, device: update, visit });
  }

  async update(current: VisitInstance<T>, update: VisitAttributes<T>): Promise<boolean> {
    if (!_.isEqual(current.csruid, update.csruid)) {
      throw new Error();
    }
    if (_.isEqual(current.device, update.device) && _.isEqual(current.visit, update.visit)) {
      this.log.info(`Skipping no-op update to ${this.label} row '${idtxt(current.csruid)}'.`);
      return false;
    }
    this.log.info(`Backup up ${this.label} row '${idtxt(current.csruid)}'.`);
    await this.backup.create(current);
    this.log.info(`Writing modified ${this.label} row '${idtxt(current.csruid)}'.`);
    await this.data.upsert(update);
    return true;
  }

  expectOneMatch<T>(key: string, items: T[]): T {
    if (items.length != 1) {
      throw new Error(`Expected exactly 1 ${this.label} row to match key '${key}', but got ${items.length}`);
    }
    return items[0];
  }
}
