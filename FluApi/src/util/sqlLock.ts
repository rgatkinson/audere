// Copyright (c) 2019 by Audere
//
// Use of this source code is governed by an MIT-style license that
// can be found in the LICENSE file distributed with this file.

import sequelize, { Sequelize } from "sequelize";
import logger from "./logger";
import { sha256 } from "./crypto";

export class SqlLock {
  private readonly sql: Sequelize;

  constructor(sql: Sequelize) {
    this.sql = sql;
  }

  runIfFree(scope: string, won: AsyncCall, lost: AsyncCall): AsyncCall {
    const key = getKey(scope);
    return async (...args) => {
      await this.sql.transaction(async transaction => {
        const query = `select pg_try_advisory_xact_lock(${key.n0}, ${key.n1}) as acquired;`;
        const options = { transaction, type: sequelize.QueryTypes.SELECT };
        const result: TryLockResult[] = await this.sql.query(query, options);
        if (result[0].acquired) {
          logger.info(`Acquired SQL lock '${scope}' (${key.hex64}), running callback`);
          await won(...args);
          logger.info(`Releasing SQL lock '${scope}' (${key.hex64})`);
          // Lock should be released when transaction completes.
        } else {
          logger.warn(`Failed to acquire SQL lock '${scope}' (${key.hex64})`);
          await lost(...args);
        }
      });
    };
  }
}

type AsyncCall = (...args: any[]) => Promise<void>;

interface TryLockResult {
  acquired: boolean;
}

const scopeMap = new Map<string,string>();

function getKey(scope: string): Key {
  const hex64 = sha256(scope).substring(0, 16);
  const previousScope = scopeMap.get(hex64);
  if (previousScope != null) {
    if (previousScope !== scope) {
      // Not a correctness issue, would hypothetically cause unnecessary contention.
      logger.error(`SqlLock: hash collision '${scope}' and '${previousScope}' both hash to '${hex64}'`);
    }
  } else {
    scopeMap.set(hex64, scope);
  }

  return {
    hex64,
    n0: hex32ToSignedInt(hex64.substring(0, 8)),
    n1: hex32ToSignedInt(hex64.substring(8, 16)),
  };
}

function hex32ToSignedInt(hex32: string) {
  const unsigned = parseInt(hex32, 16);
  return ((unsigned & 0x80000000) != 0) ? unsigned - 0x100000000 : unsigned;
}

interface Key {
  hex64: string;
  n0: number;
  n1: number;
}
