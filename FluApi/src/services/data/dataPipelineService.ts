// Copyright (c) 2019 by Audere
//
// Use of this source code is governed by an MIT-style license that
// can be found in the LICENSE file distributed with this file.

import { Sequelize, Transaction } from "sequelize";
import { Hash } from "../../util/crypto";
import { DataPipeline, ManagedSqlNode } from "./dataPipeline";
import {
  defineDataNode,
  defineDataPipeline,
} from "../../models/db/dataPipeline";
import { tuple2 } from "../../util/tuple";
import logger from "../../util/logger";

export class DataPipelineService {
  private readonly MILLION = BigInt("1000000");
  private readonly progress: () => void;

  constructor(progress?: () => void) {
    this.progress = progress || (() => {});
  }

  async refresh(pipeline: DataPipeline): Promise<void> {
    const sql = pipeline.db;
    const nodes = pipeline.nodes;

    const pipelineState = defineDataPipeline(sql);
    const databasePipeline = await pipelineState.findOne({
      where: {
        name: pipeline.name,
      },
    });

    if (databasePipeline.id == null) {
      throw Error(
        `Error encountered when running refresh on data pipeline: ` +
          `Pipeline ${pipeline.name} does not exist.`
      );
    }

    const nodeState = defineDataNode(sql);
    const states = await nodeState.findAll({
      where: {
        pipeline: databasePipeline.id,
      },
    });
    logger.info(
      `Refreshing ${nodes.length} nodes from  ${states.length} existing`
    );
    const statesByName = new Map(states.map(x => tuple2(x.name, x)));
    const nodesByName = new Map(nodes.map(x => tuple2(x.meta.name, x)));
    const hashes = buildHashes(nodesByName);
    this.progress();

    for (let state of states) {
      const name = state.name;
      if (!nodesByName.has(name)) {
        logger.info(`Destroying node ${name}`);
        await runQuery(sql, state.cleanup);
        this.progress();
        await nodeState.destroy({ where: { name } });
        this.progress();
      }
    }

    for (let node of nodes) {
      const start = process.hrtime.bigint();
      const name = node.meta.name;
      const state = statesByName.get(name);
      const hash = hashes.get(name);
      if (state != null && state.hash === hash) {
        const refresh = node.getRefresh();
        if (refresh != null) {
          await sql.transaction(async t => {
            for (let i = 0; i < refresh.length; i++) {
              await runQuery(sql, refresh[i], t);
            }
          });
          const end = process.hrtime.bigint();
          logger.info(
            `Refreshed ${name} in ${(end - start) / this.MILLION} ms`
          );
          this.progress();
        }
      } else {
        const drop = node.getDelete();
        await runQuery(sql, drop);
        this.progress();
        const create = node.getCreate();
        await sql.transaction(async t => {
          for (let i = 0; i < create.length; i++) {
            await runQuery(sql, create[i], t);
            this.progress();
          }
        });
        await nodeState.upsert({
          name,
          hash,
          cleanup: drop,
          pipeline: databasePipeline.id,
        });
        const end = process.hrtime.bigint();
        logger.info(`Recreated ${name} in ${(end - start) / this.MILLION} ms`);
        this.progress();
      }
    }
  }
}

async function runQuery(
  sql: Sequelize,
  query: string,
  transaction?: Transaction
): Promise<void> {
  logger.debug(`Running SQL: ${query}`);
  if (transaction != null) {
    await sql.query(query, { transaction: transaction });
  } else {
    await sql.query(query);
  }
}

// Assumes Map.values() returns nodes in insertion order
function buildHashes(nodesByName: Map<string, ManagedSqlNode>) {
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
