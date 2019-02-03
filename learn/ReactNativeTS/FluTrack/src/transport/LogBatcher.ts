// Copyright (c) 2018 by Audere
//
// Use of this source code is governed by an MIT-style license that
// can be found in the LICENSE file distributed with this file.

import uuidv4 from "uuid/v4";
import { DocumentType, LogRecordInfo, LogRecordLevel } from "audere-lib";
import { DocumentUploader } from "./DocumentUploader";
import { Pump } from "./Pump";
import { Logger } from "./LogUtil";

const DEFAULT_OPTIONS = {
  guessRecordOverheadInChars: 40,
  targetBatchSizeInChars: 1024 * 1024,
  targetBatchIntervalInMs: 20 * 1000,
  maxLineLength: 300,
  lineTruncateTail: 50,
  pouchDbKey: "PendingLogRecords",
  echoToConsole: process.env.NODE_ENV === "development",
}

export class LogBatcher implements Logger {
  private readonly uploader: LazyUploader;
  private readonly priority: number;
  private readonly db: any;
  private readonly buffer: LogRecordInfo[];
  private readonly pump: Pump;
  private readonly config: typeof DEFAULT_OPTIONS;

  constructor(
    uploader: LazyUploader,
    priority: number,
    db: LogStore,
    options: ConfigOptions = {},
  ) {
    this.uploader = uploader;
    this.priority = priority;
    this.db = db;
    this.buffer = [];
    this.config = { ...DEFAULT_OPTIONS, ...options };

    this.pump = new Pump(() => this.pumpState(), this);
  }

  public debug(text: string): void {
    this.write(LogRecordLevel.Debug, text);
  }

  public info(text: string): void {
    this.write(LogRecordLevel.Info, text);
  }

  public warn(text: string): void {
    this.write(LogRecordLevel.Warn, text);
  }

  public error(text: string): void {
    this.write(LogRecordLevel.Error, text);
  }

  public fatal(text: string): void {
    this.write(LogRecordLevel.Fatal, text);
  }

  public write(level: LogRecordLevel, text: string): void {
    const timestamp = new Date().toISOString();
    this.writeRecord({ timestamp, level, text: this.truncate(text) });
  }

  public writeRecord(record: LogRecordInfo): void {
    this.echo(`${record.timestamp} [${record.level}]: ${record.text}`);
    this.buffer.push(record);
    this.pump.start();
  }

  private echo(text: string) {
    if (this.config.echoToConsole) {
      console.log(text);
    }
  }

  private async pumpState(): Promise<void> {
    const adding = this.buffer.splice(0);
    if (adding.length > 0) {
      const state = await this.loadPending();
      const size = state.size + this.buffer.reduce((acc, x) => acc + this.guessSize(x), 0);
      const records = ((state == null) ? [] : state.records).concat(adding);
      const durationMs = (Date.now() - new Date(records[0].timestamp).getTime());
      const uploader = this.uploader.get();
      const needsUpload = (
        (size > this.config.targetBatchSizeInChars) ||
        (durationMs > this.config.targetBatchIntervalInMs)
      );

      this.echo(
        `LogBatcher:` +
        ` needsUpload=${needsUpload}` +
        `, adding ${adding.length}+${state.records.length}=${records.length}` +
        `, size=${size}` +
        `, dur=${durationMs}ms`
      );

      try {
        if (needsUpload && (uploader != null)) {
          const batch = {
            timestamp: new Date().toISOString(),
            records,
          }
          this.echo(`LogBatcher: sending ${records.length} records to DocumentUploader`);
          uploader.save(uuidv4(), batch, DocumentType.LogBatch, this.priority);
          this.echo(`LogBatcher: clearing Pouch state`);
          await this.db.put({ ...state, ...this.emptyState()});
          this.echo(`LogBatcher: cleared Pouch state`);
        } else {
          this.echo(`LogBatcher: writing ${records.length} records to PouchDB`);
          await this.db.put({ ...state, size, records });
        }
      } catch (e) {
        // Hope that the crash log handler can upload a bit of the log state.
        throw new Error(`=====\n${e}\nWhile writing log batch:\n${this.summarize(records)}\n=====`);
      }
    }
  }

  private async loadPending(): Promise<PendingLogState> {
    try {
      return await this.db.get(this.config.pouchDbKey);
    } catch (e) {
      return this.emptyState();
    }
  }

  private emptyState(): PendingLogState {
    return {
      _id: this.config.pouchDbKey,
      schemaId: 1,
      size: 0,
      records: [],
    };
  }

  private guessSize(record: LogRecordInfo): number {
    return (
      record.timestamp.length +
      record.level.length +
      record.text.length +
      this.config.guessRecordOverheadInChars
    );
  }

  private truncate(text: string): string {
    const max = this.config.maxLineLength;
    if (text.length < max) {
      return text;
    } else {
      const ellipses = " ... ";
      const tail = this.config.lineTruncateTail;
      const head = max - (tail + ellipses.length);
      return text.substring(0, head) + ellipses + text.substring(text.length - tail);
    }
  }

  private summarize(records: LogRecordInfo[]): string {
    return records.slice(-40).reduce(
      (acc, x) => acc + `${x.timestamp}: [${x.level}] ${x.text}\n`,
      ""
    )
  }
}

// Uploader emits logs, so this is circular.  Lazify our usage of DocumentUploader.
// Factoring out 'bind' here avoids making it available to users of LogBatcher.
export class LazyUploader {
  private uploader: DocumentUploader | null = null;

  public bind(uploader: DocumentUploader): void {
    if (this.uploader != null) {
      throw new Error("LazyUploader: uploader already set");
    }
    this.uploader = uploader;
  }

  public get(): DocumentUploader | null { return this.uploader; }
}

type PendingLogState = PendingLogState1;

interface PendingLogState1 {
  _id: string;
  schemaId: 1;
  size: number;
  records: LogRecordInfo[];
}

interface LogStore {
  get(key: string): Promise<PendingLogState>;
  put(state: PendingLogState): Promise<void>;
}

interface ConfigOptions {
  guessRecordOverheadInChars?: number;
  targetBatchSizeInChars?: number;
  targetBatchIntervalInMs?: number;
  maxLineLength?: number;
  lineTruncateTail?: number;
  pouchDbKey?: string;
}
