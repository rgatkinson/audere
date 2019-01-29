#!/usr/bin/env node
// Copyright (c) 2018 by Audere
//
// Use of this source code is governed by an MIT-style license that
// can be found in the LICENSE file distributed with this file.

import child_process from "child_process";
import Sequelize from "sequelize";
import yargs from "yargs";
import _ from "lodash";

import { ScriptLogger } from "./util/script_logger";
import { VisitNonPIIUpdater, VisitPIIUpdater } from "./util/visit_updater";

const log = new ScriptLogger(console.log);

const sequelizeNonPII = new Sequelize(process.env.NONPII_DATABASE_URL, { logging: false });
const updaterNonPII = new VisitNonPIIUpdater(sequelizeNonPII, log);

const sequelizePII = new Sequelize(process.env.PII_DATABASE_URL, { logging: false });
const updaterPII = new VisitPIIUpdater(sequelizePII, log);

(
  yargs
  .option('verbose', {
    alias: 'v',
    boolean: true,
    global: true,
  })
  .command({
    command: 'demo <row> [unset]',
    builder: (yargs) => yargs.string('row').boolean('unset'),
    handler: command(cmdDemo),
  })
  .command({
    command: 'nonpii <row>',
    builder: (yargs) => yargs.string('row'),
    handler: command(cmdShowNonPII),
  })
  .command({
    command: 'pii <row>',
    builder: (yargs) => yargs.string('row'),
    handler: command(cmdShowPII),
  })
  .demandCommand().argv
);

function command(cmd: any) {
  return async (argv: any) => {
    log.setVerbose(argv.verbose);
    await cmd(argv);
    shutdownDb();
    log.close();
  }
}

function shutdownDb(): void {
  log.info(`Closing NonPII database connection.`);
  sequelizeNonPII.close();
  log.info(`Closing PII database connection.`);
  sequelizePII.close();
}

interface ShowArgs {
  row: string;
}

async function cmdShowNonPII(argv: ShowArgs): Promise<void> {
  const data = await updaterNonPII.load(argv.row);
  console.log(JSON.stringify(data.visit));
}

async function cmdShowPII(argv: ShowArgs): Promise<void> {
  const data = await updaterPII.load(argv.row);
  console.log(JSON.stringify(data.visit));
}

interface DemoArgs {
  row: string;
  unset: boolean;
}

async function cmdDemo(argv: DemoArgs): Promise<void> {
  const isDemo = !argv.unset;
  const dataNP = await updaterNonPII.load(argv.row);
  const csruid = dataNP.csruid;
  const dataP = await updaterPII.load(csruid);

  await Promise.all([
    updaterNonPII.setDemo(dataNP, isDemo),
    updaterPII.setDemo(dataP, isDemo),
  ]);
}
