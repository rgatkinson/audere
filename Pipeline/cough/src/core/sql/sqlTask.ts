// Copyright (c) 2019 by Audere
//
// Use of this source code is governed by an MIT-style license that
// can be found in the LICENSE file distributed with this file.

import { Sequelize, Transaction } from "sequelize";
import { Inst, Model } from "./sql";
import { ManagedSqlNode } from "./sqlNodes";
import { defineDataNode, DataNodeAttributes } from "./model";
import { tuple2 } from "../tuple";
import crypto from "crypto";
import logger from "../logger";

const DEBUG_DATA_PIPELINE = false;

export abstract class SQLTask {
  private readonly sql: Sequelize;
  private readonly nodeState: Model<DataNodeAttributes>;

  abstract nodes: ManagedSqlNode[];

  constructor(sql: Sequelize) {
    this.sql = sql;
    this.nodeState = defineDataNode(sql);
  }

  public async refresh(names?: string[]): Promise<void> {
    const states = await this.getNodes(names);
    const statesByName = new Map(states.map(x => tuple2(x.name, x)));
    const nodesByName = new Map(this.nodes.map(x => tuple2(x.meta.name, x)));
    const hashes = this.buildHashes(nodesByName);

    for (let state of states) {
      const name = state.name;
      if (!nodesByName.has(name)) {
        logger.info(
          `Database node with name ${name} is obsolete and will be destroyed`
        );
        await this.runQuery(this.sql, state.cleanup);
        await this.nodeState.destroy({ where: { name } });
      }
    }

    for (let node of this.nodes) {
      const name = node.meta.name;
      const state = statesByName.get(name);
      const hash = hashes.get(name);
      if (state != null && state.hash === hash) {
        logger.info(`Input node ${name} has not been updated and will refresh`);
        const refresh = node.getRefresh();
        if (refresh != null) {
          await this.sql.transaction(async t => {
            for (let i = 0; i < refresh.length; i++) {
              await this.runQuery(this.sql, refresh[i], t);
            }
          });
        }
      } else {
        logger.info(
          `Input node ${name} has been updated and will be recreated`
        );
        const drop = node.getDelete();
        await this.runQuery(this.sql, drop);
        const create = node.getCreate();
        await this.sql.transaction(async t => {
          for (let i = 0; i < create.length; i++) {
            await this.runQuery(this.sql, create[i], t);
          }
        });
        await this.nodeState.upsert({ name, hash, cleanup: drop });
      }
    }
  }

  private async getNodes(names: string[]): Promise<Inst<DataNodeAttributes>[]> {
    if (names == null) {
      return await this.nodeState.findAll({});
    } else {
      return await this.nodeState.findAll({
        where: {
          name: names,
        },
      });
    }
  }

  private async runQuery(
    sql: Sequelize,
    query: string,
    transaction?: Transaction
  ): Promise<void> {
    debug(`=== Running SQL ===\n${query}`);
    if (transaction != null) {
      await sql.query(query, { transaction: transaction });
    } else {
      await sql.query(query);
    }
  }

  // Assumes Map.values() returns nodes in insertion order
  private buildHashes(nodesByName: Map<string, ManagedSqlNode>) {
    const hashes = new Map();
    for (let node of nodesByName.values()) {
      const hash = new Hash();
      const create = node.getCreate();
      create.forEach(s => hash.update(s));
      const refresh = node.getRefresh();
      if (Array.isArray(refresh)) {
        refresh.forEach(s => hash.update(s));
      }
      hash.update(node.getDelete());
      node.meta.deps.forEach(name => hash.update(hashes.get(name)));
      hashes.set(node.meta.name, hash.toString());
    }
    return hashes;
  }
}

// Simplified version of crypto.createHash() that:
// * supports builder pattern by update() returning this.
// * tolerates nulls in update().
// * only generates "hex" digests via toString().
// * supports toString() any number of times.
export class Hash {
  private readonly hash;
  private value: string | null;

  constructor(kind?: string) {
    this.hash = crypto.createHash(kind || "SHA256");
    this.value = null;
  }

  update(x: string | null) {
    this.hash.update(x || "");
    return this;
  }

  toString(): string {
    if (this.value == null) {
      this.value = this.hash.digest("hex");
    }
    return this.value;
  }
}

function debug(s: string) {
  if (DEBUG_DATA_PIPELINE) {
    console.log(`Pipeline: ${s}`);
  }
}
