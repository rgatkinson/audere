// Copyright (c) 2018 by Audere
//
// Use of this source code is governed by an MIT-style license that
// can be found in the LICENSE file distributed with this file.

import uuidv4 from "uuid/v4";
import {
  DocumentType,
  LogRecordInfo,
  LogRecordLevel,
  AnalyticsInfo,
  EventInfo,
  EventInfoKind,
} from "audere-lib/coughProtocol";
import { Pump } from "./Pump";
import { Logger } from "./LogUtil";
import { EventTracker } from "./EventUtil";
import { newCSRUID } from "../util/csruid";

const DEFAULT_OPTIONS = {
  guessRecordOverheadInChars: 40,
  targetBatchSizeInChars: 64 * 1024,
  targetBatchIntervalInMs: 5 * 60 * 1000,
  maxLineLength: envAsNumber(process.env.LOG_RECORD_LIMIT, 256),
  lineTruncateTail: 50,
  pouchDbKey: "PendingLogRecords",
  echoToConsole: process.env.NODE_ENV === "development",
  uploadPriority: 3,
};

export class AnalyticsBatcher implements EventTracker, Logger {
  private readonly uploader: LazyUploader;
  private readonly db: any;
  private readonly logs: LogRecordInfo[];
  private readonly events: EventInfo[];
  private readonly pump: Pump;
  private readonly config: typeof DEFAULT_OPTIONS;

  constructor(
    uploader: LazyUploader,
    db: AnalyticsStore,
    options: ConfigOptions = {}
  ) {
    this.uploader = uploader;
    this.db = db;
    this.logs = [];
    this.events = [];
    this.config = { ...DEFAULT_OPTIONS, ...options };
    this.echo(`Config = ${JSON.stringify(this.config)}`);

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
    // const timestamp = new Date().toISOString();
    // this.echo(`${timestamp} [${level}]: ${text}`);
    // this.logs.push({ timestamp, level, text: this.truncate(text) });
    // this.pump.start();
  }

  public fireNow(kind: EventInfoKind, refId?: string): void {
    this.fire({
      kind,
      at: new Date().toISOString(),
      refId,
    });
  }

  public fire(event: EventInfo): void {
    // this.events.push(event);
    // this.pump.start();
  }

  private echo(text: string) {
    if (this.config.echoToConsole) {
      console.log(text);
    }
  }

  private async pumpState(): Promise<void> {
    const newLogs = this.logs.splice(0);
    const newEvents = this.events.splice(0);
    if (newLogs.length > 0 || newEvents.length > 0) {
      const state = await this.loadPending();
      const size =
        state.size +
        newLogs.reduce((acc, x) => acc + this.guessLogSize(x), 0) +
        newEvents.reduce((acc, x) => acc + this.guessEventSize(x), 0);
      const oldLogs = (state && state.logs) || [];
      const oldEvents = (state && state.events) || [];
      const logs = oldLogs.concat(newLogs);
      const events = oldEvents.concat(newEvents);
      const durationMs = Date.now() - new Date(logs[0].timestamp).getTime();
      const uploader = this.uploader.get();
      const hasFatal = logs.some(x => x.level === LogRecordLevel.Fatal);
      const needsUpload =
        size > this.config.targetBatchSizeInChars ||
        durationMs > this.config.targetBatchIntervalInMs ||
        hasFatal;

      this.echo(
        `LogBatcher:` +
          ` needsUpload=${needsUpload}` +
          `, adding` +
          ` logs:${newLogs.length}+${oldLogs.length}=${logs.length}` +
          ` events:${newEvents.length}+${oldEvents.length}=${events.length}` +
          `, size=${size}` +
          `, dur=${durationMs}ms`
      );

      try {
        if (needsUpload && uploader != null) {
          const timestamp = new Date().toISOString();
          const analytics = { timestamp, logs, events };
          this.echo(
            `LogBatcher: sending ${logs.length} records to DocumentUploader`
          );
          const csruid = await newCSRUID();
          this.echo(`LogBatcher: csruid = '${csruid}'`);
          uploader.save(
            csruid,
            analytics,
            DocumentType.Analytics,
            this.config.uploadPriority
          );
          this.echo(`LogBatcher: clearing Pouch state`);
          await this.db.put({ ...state, ...this.emptyState() });
          this.echo(`LogBatcher: cleared Pouch state`);
        } else {
          this.echo(`LogBatcher: writing ${logs.length} records to PouchDB`);
          await this.db.put({ ...state, size, logs, events });
        }
      } catch (e) {
        // Hope that the crash log handler can upload a bit of the log state.
        throw new Error(
          `=====\n${e}\nWhile writing log batch:\n${this.summarize(
            logs
          )}\n=====`
        );
      }
    }
  }

  private async loadPending(): Promise<PendingState> {
    try {
      return await this.db.get(this.config.pouchDbKey);
    } catch (e) {
      return this.emptyState();
    }
  }

  private emptyState(): PendingState {
    return {
      _id: this.config.pouchDbKey,
      schemaId: 1,
      size: 0,
      logs: [],
      events: [],
    };
  }

  private guessLogSize(record: LogRecordInfo): number {
    return (
      record.timestamp.length +
      record.level.length +
      record.text.length +
      this.config.guessRecordOverheadInChars
    );
  }

  private guessEventSize(event: EventInfo): number {
    return (
      event.at.length +
      (event.until ? event.until.length : 0) +
      (event.refId ? event.refId.length : 0) +
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
      return (
        text.substring(0, head) + ellipses + text.substring(text.length - tail)
      );
    }
  }

  private summarize(records: LogRecordInfo[]): string {
    return records
      .slice(-40)
      .reduce((acc, x) => acc + `${x.timestamp}: [${x.level}] ${x.text}\n`, "");
  }
}

function envAsNumber(env: string | undefined, defaultValue: number): number {
  if (env == null) {
    return defaultValue;
  }
  const casted = +env;
  if (isNaN(casted)) {
    return defaultValue;
  }
  return casted;
}

// Uploader emits logs, so this is circular.  Lazify our usage of DocumentUploader.
// Factoring out 'bind' here avoids making it available to users of LogBatcher.
export class LazyUploader {
  private uploader: Uploader | null = null;

  public bind(uploader: Uploader): void {
    if (this.uploader != null) {
      throw new Error("LazyUploader: uploader already set");
    }
    this.uploader = uploader;
  }

  public get(): Uploader | null {
    return this.uploader;
  }
}

export interface Uploader {
  save(
    localUid: string,
    document: AnalyticsInfo,
    documentType: DocumentType,
    priority: number
  ): void;
}

export interface PendingState {
  _id: string;
  schemaId: 1;
  size: number;
  logs: LogRecordInfo[];
  events: EventInfo[];
}

export interface AnalyticsStore {
  get(key: string): Promise<PendingState>;
  put(state: PendingState): Promise<void>;
}

export interface ConfigOptions {
  guessRecordOverheadInChars?: number;
  targetBatchSizeInChars?: number;
  targetBatchIntervalInMs?: number;
  maxLineLength?: number;
  lineTruncateTail?: number;
  pouchDbKey?: string;
  echoToConsole?: boolean;
  uploadPriority?: number;
}
