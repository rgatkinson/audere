// Copyright (c) 2018 by Audere
//
// Use of this source code is governed by an MIT-style license that
// can be found in the LICENSE file distributed with this file.

import Sequelize, {Model} from "sequelize";
import { defineSqlVisit, VisitAttributes, VisitInstance, VisitTableType } from "../../src/models/visit";
import _ from "lodash";

import { DeviceInfo, VisitNonPIIDbInfo, VisitPIIInfo } from "audere-lib";

import { idtxt, ScriptLogger } from "./script_logger";

const Op = Sequelize.Op;

type VisitModel<T> = Model<VisitInstance<T>, VisitAttributes<T>>;

export abstract class VisitUpdater<T extends object & {isDemo?: boolean}> {
  private readonly data: VisitModel<T>;
  private readonly backup: VisitModel<T>;
  protected readonly log: ScriptLogger;
  private readonly label: string;

  constructor(sequelize: Sequelize.Sequelize, log: ScriptLogger, label: string) {
    this.data = defineSqlVisit(sequelize);
    this.backup = defineSqlVisit(sequelize, VisitTableType.BACKUP);
    this.log = log;
    this.label = label;
  }

  async cleanupForTesting(...csruids: string[]): Promise<void> {
    const actions = [];
    for (let csruid of csruids) {
      const where = { where: { csruid }};
      actions.push(this.data.destroy(where));
      actions.push(this.backup.destroy(where));
    }
    await Promise.all(actions);
  }

  abstract async setDemo(current: VisitInstance<T>, isDemo: boolean): Promise<boolean>;

  async load(key: string): Promise<VisitInstance<T>> {
    this.log.info(`VisitUpdater.load ${this.label} for key '${idtxt(key)}'.`);
    const rows = looksLikeRowId(key)
      ? await this.data.findAll({ where: { id: key }})
      : await this.data.findAll({ where: { csruid: { [Op.like]: `${key}%` }}});
    return this.expectOneMatch(key, rows);
  }

  async loadBackup(rowId: string): Promise<VisitInstance<T>> {
    this.log.info(`VisitUpdater.loadBackup ${this.label} for rowId '${rowId}'.`);
    expectRowId(rowId);
    const rows = await this.backup.findAll({ where: { id: rowId }});
    return this.expectOneMatch(rowId, rows);
  }

  async loadBackups(csruid: string): Promise<VisitInstance<T>[]> {
    this.log.info(`VisitUpdater.loadBackups ${this.label} for csruid '${idtxt(csruid)}'.`);
    expectCSRUID(csruid);
    return await this.backup.findAll({ where: {csruid: { [Op.like]: `${csruid}%` }}});
  }

  async updateVisit(current: VisitInstance<T>, update: T): Promise<boolean> {
    const { csruid, device } = current;
    return this.update(current, { csruid, device, visit: update });
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

    this.log.info(`Backing up ${this.label} row '${idtxt(current.csruid)}'.`);
    await this.backup.create({
      csruid: current.csruid,
      device: current.device,
      visit: current.visit,
    });

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

export class VisitNonPIIUpdater extends VisitUpdater<VisitNonPIIDbInfo> {
  constructor(sequelize: Sequelize.Sequelize, log: ScriptLogger) {
    super(sequelize, log, "non-PII");
  }

  async setDemo(current: VisitInstance<VisitNonPIIDbInfo>, isDemo: boolean): Promise<boolean> {
    this.log.info(`setDemo(${isDemo})`);
    return this.updateVisit(current, { ...current.visit, isDemo });
  }
}

export class VisitPIIUpdater extends VisitUpdater<VisitPIIInfo> {
  constructor(sequelize: Sequelize.Sequelize, log: ScriptLogger) {
    super(sequelize, log, "PII");
  }

  async setDemo(current: VisitInstance<VisitPIIInfo>, isDemo: boolean): Promise<boolean> {
    this.log.info(`setDemo(${isDemo})`);
    return this.updateVisit(current, { ...current.visit, isDemo });
  }
}

function expectRowId(rowId: string): void {
  if (!looksLikeRowId(rowId)) {
    throw new Error(`Expected numberic rowId, got '${rowId}'.`);
  }
}

function expectCSRUID(csruid: string): void {
  if (looksLikeRowId(csruid)) {
    throw new Error(`Expected non-numberic csruid, got '${csruid}'.`);
  }
}

function looksLikeRowId(key: string): boolean {
  return /^[0-9]+$/.test(key);
}
