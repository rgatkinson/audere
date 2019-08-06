// Copyright (c) 2018, 2019 by Audere
//
// Use of this source code is governed by an MIT-style license that
// can be found in the LICENSE file distributed with this file.

import Sequelize from "sequelize";
import {
  defineVisit,
  VisitAttributes,
  VisitInstance,
  VisitModel,
  VisitTableType,
} from "../../src/models/db/sniffles";
import _ from "lodash";

import {
  DeviceInfo,
  VisitNonPIIDbInfo,
  VisitPIIInfo,
} from "audere-lib/snifflesProtocol";

import { idtxt, ScriptLogger } from "./script_logger";
import { Updater } from "./updater";
import { SplitSql } from "../../src/util/sql";
import {
  defineHutchUpload,
  HutchUploadModel,
} from "../../src/models/db/hutchUpload";

const Op = Sequelize.Op;

interface Config<T> {
  sql: SplitSql;
  log: ScriptLogger;
  db: Sequelize.Sequelize;
  label: string;
}

export abstract class VisitUpdater<T extends object & { isDemo?: boolean }>
  implements Updater<VisitAttributes<T>, T, DeviceInfo> {
  private readonly sql: SplitSql;
  private readonly data: VisitModel<T>;
  private readonly backup: VisitModel<T>;
  private readonly nonPii: VisitModel<VisitNonPIIDbInfo>;
  private readonly upload: HutchUploadModel;
  protected readonly log: ScriptLogger;
  private readonly label: string;

  constructor(config: Config<T>) {
    this.sql = config.sql;
    this.data = defineVisit(config.db);
    this.backup = defineVisit(config.db, VisitTableType.BACKUP);
    this.nonPii = defineVisit(config.sql.nonPii);
    this.upload = defineHutchUpload(config.sql);
    this.log = config.log;
    this.label = config.label;
  }

  async cleanupForTesting(...csruids: string[]): Promise<void> {
    const where = {
      where: {
        csruid: csruids,
      },
    };
    const actions = [];

    for (let visit of await this.nonPii.findAll(where)) {
      actions.push(this.upload.destroy({ where: { visit_id: visit.id } }));
    }
    for (let db of [this.sql.nonPii, this.sql.pii]) {
      for (let type of [VisitTableType.CURRENT, VisitTableType.BACKUP]) {
        actions.push(defineVisit(db, type).destroy(where));
      }
    }

    await Promise.all(actions);
  }

  abstract async setDemo(
    current: VisitInstance<T>,
    isDemo: boolean
  ): Promise<boolean>;

  async load(key: string): Promise<VisitInstance<T>> {
    this.log.info(`VisitUpdater.load ${this.label} for key '${idtxt(key)}'.`);
    const rows = looksLikeRowId(key)
      ? await this.data.findAll({ where: { id: key } })
      : await this.data.findAll({
          where: { csruid: { [Op.like]: `${key}%` } },
        });
    return this.expectOneMatch(key, rows);
  }

  async loadBackup(rowId: string): Promise<VisitInstance<T>> {
    this.log.info(
      `VisitUpdater.loadBackup ${this.label} for rowId '${rowId}'.`
    );
    expectRowId(rowId);
    const rows = await this.backup.findAll({ where: { id: rowId } });
    return this.expectOneMatch(rowId, rows);
  }

  async loadBackups(csruid: string): Promise<VisitInstance<T>[]> {
    this.log.info(
      `VisitUpdater.loadBackups ${this.label} for csruid '${idtxt(csruid)}'.`
    );
    expectCSRUID(csruid);
    return await this.backup.findAll({
      where: { csruid: { [Op.like]: `${csruid}%` } },
    });
  }

  async updateItem(current: VisitInstance<T>, update: T): Promise<boolean> {
    const { csruid, device } = current;
    return this.update(current, { csruid, device, visit: update });
  }

  async updateDevice(
    current: VisitInstance<T>,
    update: DeviceInfo
  ): Promise<boolean> {
    const { csruid, visit } = current;
    return this.update(current, { csruid, device: update, visit });
  }

  async update(
    current: VisitInstance<T>,
    update: VisitAttributes<T>
  ): Promise<boolean> {
    if (!_.isEqual(current.csruid, update.csruid)) {
      throw new Error();
    }
    if (
      _.isEqual(current.device, update.device) &&
      _.isEqual(current.visit, update.visit)
    ) {
      this.log.info(
        `Skipping no-op update to ${this.label} row '${idtxt(current.csruid)}'.`
      );
      return false;
    }

    this.log.info(`Backing up ${this.label} row '${idtxt(current.csruid)}'.`);
    await this.backup.create({
      csruid: current.csruid,
      device: current.device,
      visit: current.visit,
    });

    await this.deleteUploadMarker(current.csruid);

    this.log.info(
      `Writing modified ${this.label} row '${idtxt(current.csruid)}'.`
    );
    await this.data.upsert(update);

    return true;
  }

  async deleteUploadMarker(csruid: string): Promise<boolean> {
    const nonPii = this.expectOneMatch(
      "csruid",
      await this.nonPii.findAll({
        where: { csruid: { [Op.like]: `${csruid}%` } },
      })
    );

    const uploads = await this.upload.destroy({
      where: { visit_id: nonPii.id },
    });
    switch (uploads) {
      case 0:
        return false;
      case 1:
        return true;
      default:
        throw new Error(
          `Expected to delete 0 or 1 upload markers, but deleted ${uploads}`
        );
    }
  }

  expectOneMatch<T>(key: string, items: T[]): T {
    if (items.length != 1) {
      throw new Error(
        `Expected exactly 1 ${this.label} row to match key '${key}', but got ${items.length}`
      );
    }
    return items[0];
  }
}

export class VisitNonPIIUpdater extends VisitUpdater<VisitNonPIIDbInfo> {
  constructor(sql: SplitSql, log: ScriptLogger) {
    super({ sql, log, db: sql.nonPii, label: "non-PII" });
  }

  async setDemo(
    current: VisitInstance<VisitNonPIIDbInfo>,
    isDemo: boolean
  ): Promise<boolean> {
    this.log.info(`setDemo(${isDemo})`);
    return this.updateItem(current, { ...current.visit, isDemo });
  }
}

export class VisitPIIUpdater extends VisitUpdater<VisitPIIInfo> {
  constructor(sql: SplitSql, log: ScriptLogger) {
    super({ sql, log, db: sql.pii, label: "PII" });
  }

  async setDemo(
    current: VisitInstance<VisitPIIInfo>,
    isDemo: boolean
  ): Promise<boolean> {
    this.log.info(`setDemo(${isDemo})`);
    return this.updateItem(current, { ...current.visit, isDemo });
  }
}

function expectRowId(rowId: string): void {
  if (!looksLikeRowId(rowId)) {
    throw new Error(`Expected numeric rowId, got '${rowId}'.`);
  }
}

function expectCSRUID(csruid: string): void {
  if (looksLikeRowId(csruid)) {
    throw new Error(`Expected non-numeric csruid, got '${csruid}'.`);
  }
}

function looksLikeRowId(key: string): boolean {
  return /^[0-9]+$/.test(key);
}
