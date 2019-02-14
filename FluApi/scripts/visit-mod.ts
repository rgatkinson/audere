#!/usr/bin/env node
// Copyright (c) 2018 by Audere
//
// Use of this source code is governed by an MIT-style license that
// can be found in the LICENSE file distributed with this file.

import { tmpdir } from "os";
import { join as pjoin } from "path";
import { spawn } from "child_process";
import fs from "fs";
import { promisify } from "util";
import { createInterface as createReadline } from "readline";
import Sequelize from "sequelize";
import yargs from "yargs";
import _ from "lodash";

import { ScriptLogger } from "./util/script_logger";
import { VisitNonPIIUpdater, VisitPIIUpdater } from "./util/visit_updater";
import { partPath, getPart, setPart } from "./util/pathEdit";

const readFile = promisify(fs.readFile);
const writeFile = promisify(fs.writeFile);
const mkdtemp = promisify(fs.mkdtemp);
const unlink = promisify(fs.unlink);
const rmdir = promisify(fs.rmdir);

const log = new ScriptLogger(console.log);

const sequelizeNonPII = new Sequelize(process.env.NONPII_DATABASE_URL, {
  logging: false
});
const updaterNonPII = new VisitNonPIIUpdater(sequelizeNonPII, log);

const sequelizePII = new Sequelize(process.env.PII_DATABASE_URL, {
  logging: false
});
const updaterPII = new VisitPIIUpdater(sequelizePII, log);

yargs
  .option("verbose", {
    alias: "v",
    boolean: true,
    global: true
  })
  .command({
    command: "demo <row> [unset]",
    builder: yargs => yargs.string("row").boolean("unset"),
    handler: command(cmdDemo)
  })
  .command({
    command: "show <kind> <row>",
    builder: yargs => yargs.string("kind").string("row"),
    handler: command(cmdShow)
  })
  .command({
    command: "edit <kind> <row> <path>",
    builder: yargs =>
      yargs
        .string("kind")
        .string("row")
        .string("path"),
    handler: command(cmdEdit)
  })
  .demandCommand().argv;

function command(cmd: any) {
  return async (argv: any) => {
    log.setVerbose(argv.verbose);
    try {
      await cmd(argv);
    } catch (err) {
      if (err.checked) {
        console.error(`Error: ${err.message}`);
      } else {
        throw err;
      }
    } finally {
      shutdownDb();
      log.close();
    }
  };
}

function shutdownDb(): void {
  log.info(`Closing NonPII database connection.`);
  sequelizeNonPII.close();
  log.info(`Closing PII database connection.`);
  sequelizePII.close();
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
    updaterPII.setDemo(dataP, isDemo)
  ]);
}

interface ShowArgs {
  kind: string;
  row: string;
}

async function cmdShow(argv: ShowArgs): Promise<void> {
  const updater = updaterFor(argv.kind);
  const data = await updater.load(argv.row);
  console.log(JSON.stringify(data.visit));
}

interface EditArgs {
  kind: string;
  row: string;
  path: string;
}

async function cmdEdit(argv: EditArgs): Promise<void> {
  if (argv.kind === "pii") {
    await cmdEditPii(argv.row, argv.path);
  } else if (argv.kind === "nonpii") {
    await cmdEditNonPii(argv.row, argv.path);
  }
  console.log("Committed changes.");
}

async function cmdEditNonPii(row: string, path: string): Promise<void> {
  const original = await updaterNonPII.load(row);
  const merged = await editVisitPart(original, path);
  await updaterNonPII.updateVisit(original, merged);
}

async function cmdEditPii(row: string, path: string): Promise<void> {
  const original = await updaterPII.load(row);
  const merged = await editVisitPart(original, path);
  await updaterPII.updateVisit(original, merged);
}

async function editVisitPart(original: any, path: string) {
  const pathNodes = partPath(path);
  const part = getPart(original.visit, pathNodes);
  const edited = await editJson(part);

  const uid = original.csruid.substring(0, 21);
  console.log(`Preparing to update id=${original.id} csruid=${uid}..`);
  await colordiff(part, edited);
  console.log("Do you want to write these changes to the database?");
  await expectYes("Anything besides 'yes' will cancel. Choose wisely: ")

  return setPart(original.visit, pathNodes, edited);
}

async function editJson(originalValue: any): Promise<any> {
  const cleanups = [];

  try {
    const tmp = await mkdtemp(pjoin(tmpdir(), `db-json-edit-`));
    cleanups.push(() => rmdir(tmp))

    const editPath = pjoin(tmp, "edit.json");
    console.log(`Temporary file: '${editPath}'`);
    const originalJson = JSON.stringify(originalValue, null, 2);

    await writeFile(editPath, originalJson, "UTF-8");
    cleanups.push(() => unlink(editPath));

    const editor = process.env.EDITOR || process.env.VISUAL || "vim";
    await run(editor, editPath);

    const editedJson = await readFile(editPath, "UTF-8");
    const editedValue = JSON.parse(editedJson);

    if (_.isEqual(originalValue, editedValue)) {
      throw fail("canceling because no changes detected.");
    }

    return editedValue;
  } finally {
    await cleanups.reduceRight((acc, p) => acc.then(p), Promise.resolve());
  }
}

async function expectYes(query: string): Promise<void> {
  const answer = await question(query);
  if (answer !== "yes") {
    throw fail(`canceling because '${answer}' is not 'yes'`)
  }
}

async function question(query: string): Promise<string> {
  const rl = createReadline({
    input: process.stdin,
    output: process.stdout,
  });
  return new Promise<string>(resolve => {
    rl.question(query, (answer) => {
      rl.close();
      resolve(answer);
    });
  });
}

async function colordiff(before: any, after: any): Promise<void> {
  const cleanups = [];
  try {
    const tmp = await mkdtemp(pjoin(tmpdir(), `json-diff-`));
    cleanups.push(() => rmdir(tmp))

    const beforePath = pjoin(tmp, "before.json");
    const afterPath = pjoin(tmp, "after.json");

    await writeFile(beforePath, JSON.stringify(before, null, 2) + "\n", "UTF-8");
    cleanups.push(() => unlink(beforePath));

    await writeFile(afterPath, JSON.stringify(after, null, 2) + "\n", "UTF-8");
    cleanups.push(() => unlink(afterPath));

    const code = await runCode("colordiff", "--unified=3", beforePath, afterPath);
    if ([0, 1].indexOf(code) < 0) {
      throw fail(`'colordiff' exited with code '${code}', expected 0 or 1`);
    }
  } finally {
    await cleanups.reduceRight((acc, p) => acc.then(p), Promise.resolve());
  }
}

async function run(program: string, ...args: string[]): Promise<void> {
  const code = await runCode(program, ...args);
  if (code != 0) {
    throw fail(`'${program}' exited with code '${code}'`);
  }
}

function runCode(program: string, ...args: string[]): Promise<number> {
  return new Promise<number>((resolve, reject) => {
    const proc = spawn(program, args, {
      stdio: "inherit",
      shell: true
    });
    proc.on("close", code => {
      resolve(code);
    });
  });
}

function updaterFor(db: string): VisitNonPIIUpdater | VisitPIIUpdater {
  if (db === "pii") {
    return updaterPII;
  } else if (db === "nonpii") {
    return updaterNonPII;
  } else {
    throw fail(`expected db to be either 'pii' or 'nonpii', got '${db}'`);
  }
}

function fail(message: string): never {
  const error = new Error(message);
  (<any>error).checked = true;
  throw error;
}
