// Copyright (c) 2018, 2019 by Audere
//
// Use of this source code is governed by an MIT-style license that
// can be found in the LICENSE file distributed with this file.

import Sequelize from "sequelize";
import { defineSurvey, SurveyAttributes, SurveyInstance, SurveyModel, EditableTableType } from "../../src/models/fever";
import _ from "lodash";

import { DeviceInfo, SurveyNonPIIDbInfo, PIIInfo } from "audere-lib/feverProtocol";

import { idtxt, ScriptLogger } from "./script_logger";
import { Updater } from "./updater";

const Op = Sequelize.Op;

export abstract class SurveyUpdater<T extends object & {isDemo?: boolean}>
    implements Updater<SurveyAttributes<T>, T, DeviceInfo> {
  private readonly data: SurveyModel<T>;
  private readonly backup: SurveyModel<T>;
  protected readonly log: ScriptLogger;
  private readonly label: string;

  constructor(sequelize: Sequelize.Sequelize, log: ScriptLogger, label: string) {
    this.data = defineSurvey(sequelize);
    this.backup = defineSurvey(sequelize, EditableTableType.BACKUP);
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

  abstract async setDemo(current: SurveyInstance<T>, isDemo: boolean): Promise<boolean>;

  async load(key: string): Promise<SurveyInstance<T>> {
    this.log.info(`SurveyUpdater.load ${this.label} for key '${idtxt(key)}'.`);
    const rows = looksLikeRowId(key)
      ? await this.data.findAll({ where: { id: key }})
      : await this.data.findAll({ where: { csruid: { [Op.like]: `${key}%` }}});
    return this.expectOneMatch(key, rows);
  }

  async loadBackup(rowId: string): Promise<SurveyInstance<T>> {
    this.log.info(`SurveyUpdater.loadBackup ${this.label} for rowId '${rowId}'.`);
    expectRowId(rowId);
    const rows = await this.backup.findAll({ where: { id: rowId }});
    return this.expectOneMatch(rowId, rows);
  }

  async loadBackups(csruid: string): Promise<SurveyInstance<T>[]> {
    this.log.info(`SurveyUpdater.loadBackups ${this.label} for csruid '${idtxt(csruid)}'.`);
    expectCSRUID(csruid);
    return await this.backup.findAll({ where: {csruid: { [Op.like]: `${csruid}%` }}});
  }

  async updateItem(current: SurveyInstance<T>, update: T): Promise<boolean> {
    const { csruid, device } = current;
    return this.update(current, { csruid, device, survey: update });
  }

  async updateDevice(current: SurveyInstance<T>, update: DeviceInfo): Promise<boolean> {
    const { csruid, survey } = current;
    return this.update(current, { csruid, device: update, survey });
  }

  async update(current: SurveyInstance<T>, update: SurveyAttributes<T>): Promise<boolean> {
    if (!_.isEqual(current.csruid, update.csruid)) {
      throw new Error();
    }
    if (_.isEqual(current.device, update.device) && _.isEqual(current.survey, update.survey)) {
      this.log.info(`Skipping no-op update to ${this.label} row '${idtxt(current.csruid)}'.`);
      return false;
    }

    this.log.info(`Backing up ${this.label} row '${idtxt(current.csruid)}'.`);
    await this.backup.create({
      csruid: current.csruid,
      device: current.device,
      survey: current.survey,
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

export class SurveyNonPIIUpdater extends SurveyUpdater<SurveyNonPIIDbInfo> {
  constructor(sequelize: Sequelize.Sequelize, log: ScriptLogger) {
    super(sequelize, log, "non-PII");
  }

  async setDemo(current: SurveyInstance<SurveyNonPIIDbInfo>, isDemo: boolean): Promise<boolean> {
    this.log.info(`setDemo(${isDemo})`);
    return this.updateItem(current, { ...current.survey, isDemo });
  }
}

export class SurveyPIIUpdater extends SurveyUpdater<PIIInfo> {
  constructor(sequelize: Sequelize.Sequelize, log: ScriptLogger) {
    super(sequelize, log, "PII");
  }

  async setDemo(current: SurveyInstance<PIIInfo>, isDemo: boolean): Promise<boolean> {
    this.log.info(`setDemo(${isDemo})`);
    return this.updateItem(current, { ...current.survey, isDemo });
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
