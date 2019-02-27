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
import { literal, Op } from "sequelize";
import yargs from "yargs";
import _ from "lodash";
import base64url from "base64url";
import bufferXor from "buffer-xor";

import { ScriptLogger } from "./util/script_logger";
import { VisitNonPIIUpdater, VisitPIIUpdater } from "./util/visit_updater";
import { partPath, getPart, setPart } from "./util/pathEdit";
import { createSplitSql, Inst } from "../src/util/sql";
import { generateRandomKey } from "../src/util/crypto";
import { defineSnifflesModels, LogBatchAttributes } from "../src/models/sniffles";
import { LogRecordInfo, DeviceInfo } from "audere-lib/snifflesProtocol";
import { defineFeverModels } from "../src/services/feverApi/models";

const readFile = promisify(fs.readFile);
const writeFile = promisify(fs.writeFile);
const mkdtemp = promisify(fs.mkdtemp);
const unlink = promisify(fs.unlink);
const rmdir = promisify(fs.rmdir);

const log = new ScriptLogger(console.log);

const sql = createSplitSql();
const snifflesModels = defineSnifflesModels(sql);
const feverModels = defineFeverModels(sql);

const updaterNonPII = new VisitNonPIIUpdater(sql.nonPii, log);
const updaterPII = new VisitPIIUpdater(sql.pii, log);

enum Release {
  Sniffles = "sniffles",
  Fever = "fever",
}

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
    command: "generate-random-key [size]",
    builder: yargs => yargs.option("size", {
      number: true
    }),
    handler: command(cmdGenerateRandomKey),
  })
  .command({
    command: "add-access-key <release> <key>",
    builder: yargs => yargs.string("release"),
    handler: command(cmdAddAccessKey)
  })
  .command({
    command: "create-access-key <release>",
    builder: yargs => yargs.string("release"),
    handler: command(cmdCreateAccessKey)
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
  .command({
    command: "log [since] [device] [text]",
    builder: yargs => yargs
      .positional("since", {
        describe: "earliest timestamp to search",
        default: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
      })
      .positional("until", {
        describe: "latest timestamp to search",
        default: new Date(Date.now()),
      })
      .positional("device", {
        describe: "regular expression to search in device name or id",
        default: ".?"
      })
      .positional("text", {
        describe: "regular expression to search in log lines",
        default: ".?"
      }),
    handler: command(cmdLog)
  })  .demandCommand().argv;

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
      await sql.close();
      log.close();
    }
  };
}

interface LogArgs {
  since: Date;
  until: Date;
  device: string;
  text: string;
}

async function cmdLog(argv: LogArgs): Promise<void> {
  const rows = await snifflesModels.clientLogBatch.findAll({
    where: {
      [Op.and]: [
        { batch: { timestamp: { [Op.gt]: argv.since }}},
        { batch: { timestamp: { [Op.lt]: argv.until }}},
      ]
    },
    order:[
      literal("batch->>'timestamp' ASC"),
    ],
  });

  const emitter = new LogEmitter();
  const reDevice = new RegExp(argv.device);
  const reText = new RegExp(argv.text);

  rows.forEach(row => {
    if (reDevice.test(row.device.installation) || reDevice.test(row.device.deviceName)) {
      row.batch.records.forEach(record => {
        if (reText.test(record.text)) {
          emitter.emit(row, record);
        }
      });
    }
  });
}

class LogEmitter {
  private previousDevice: string = "";

  emit(row: Inst<LogBatchAttributes>, record: LogRecordInfo): void {
    this.maybeEmitDevice(row.device);
    this.emitRecord(record);
  }

  maybeEmitDevice(device: DeviceInfo): void {
    if (device.installation !== this.previousDevice) {
      console.log(`========== Device: ${device.deviceName} (${device.installation}) ==========`);
      this.previousDevice = device.installation;
    }
  }

  emitRecord(record: LogRecordInfo): void {
    const level = (<any>record.level.toString()).padStart(5, " ");
    const text = record.text.replace(/\n/g, "\\n");
    console.log(`${record.timestamp} [${level}]: ${text}`)
  }
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

interface GenerateRandomKeyArgs {
  size?: number;
}
async function cmdGenerateRandomKey(argv: GenerateRandomKeyArgs): Promise<void> {
  console.log(await generateRandomKey(argv.size));
}

interface AddAccessKeyArgs {
  release: Release;
  key: string;
}
async function cmdAddAccessKey(argv: AddAccessKeyArgs): Promise<void> {
  await accessKey(argv.release).create({
    key: argv.key,
    valid: true,
  });
  console.log(`Added access key '${argv.key}' and marked valid.`);
}

interface CreateAccessKeyArgs {
  release: Release;
}
async function cmdCreateAccessKey(argv: CreateAccessKeyArgs): Promise<void> {
  const components = [
    "X12ct9Go-AqgxyjnuCT4uOHFFokVfnB03BXo3vxw_TEQVBAaK53Kkk74mEwU5Nuw",
    await generateRandomKey(),
    await generateRandomKey()
  ];
  const buffers = components.map(base64url.toBuffer);
  const buffer = buffers.reduce(bufferXor, Buffer.alloc(0));
  const key = base64url(buffer);

  await accessKey(argv.release).create({ key, valid: true});

  console.log(`New access key created and added for ${argv.release}`);
  console.log();
  console.log("Copy the following lines to your .env file:");
  console.log(`ACCESS_KEY_A='${components[1]}'`);
  console.log(`ACCESS_KEY_B='${components[2]}'`);
  console.log();
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

// Run a command and throw if it does not exit successfully.
async function run(program: string, ...args: string[]): Promise<void> {
  const code = await runCode(program, ...args);
  if (code != 0) {
    throw fail(`'${program}' exited with code '${code}'`);
  }
}

// Run a command and returns the exit code.  Naming is hard.
// NOTE this does not throw if the command fails.
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

function accessKey(release: Release) {
  return forApp(release, {
    sniffles: snifflesModels.accessKey,
    fever: feverModels.accessKey,
  });
}

function forApp<T>(release: Release, choices: { [key in Release]: T }) {
  {
    const required = Object.keys(Release)
      .map(x => Release[x])
      .sort();
    const provided = Object.keys(choices)
      .sort();
    if (!_.isEqual(required, provided)) {
      throw new Error(
        `Internal error: forApp called with choices that don't match releases: ` +
        `required=[${required.join(",")}] ` +
        `provided=[${provided.join(",")}]`
      )
    }
  }

  const choice = choices[release];
  if (choice == null) {
    throw fail(
      `Unrecognized release: '${release}', ` +
      `expected one of '${Object.keys(Release).join("', '")}'`
    );
  }

  return choice;
}
