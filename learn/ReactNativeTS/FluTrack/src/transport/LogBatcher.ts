// Copyright (c) 2018 by Audere
//
// Use of this source code is governed by an MIT-style license that
// can be found in the LICENSE file distributed with this file.

import uuidv4 from "uuid/v4";
import { DocumentType, LogRecordInfo, LogRecordLevel } from "audere-lib";
import { DocumentUploader } from "./DocumentUploader";
import { Pump } from "./Pump";
import { Logger } from "./LogUtil";

// TODO: use uuid here to instant upload.  Though it uses N^2 bandwidth..
// TODO: deal with circularity

const PER_RECORD_EXTRA = 40;
const BATCH_SIZE_THRESHOLD = 2 * 1024 * 1024;
const SECOND = 1000;
const MINUTE = 60 * SECOND;
const BATCH_TIME_THRESHOLD = 20 * MINUTE;

const POUCH_DB_KEY = "PendingLogRecords";

export class LogBatcher implements Logger {
  private readonly uploader: LazyUploader;
  private readonly priority: number;
  private readonly db: any;
  private readonly buffer: LogRecordInfo[];
  private readonly pump: Pump;

  constructor(
    uploader: LazyUploader,
    priority: number,
    db: LogStore
  ) {
    this.uploader = uploader;
    this.priority = priority;
    this.db = db;
    this.buffer = [];
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
    this.writeRecord({ timestamp, level, text });
  }

  public writeRecord(record: LogRecordInfo): void {
    this.buffer.push(record);
    this.pump.start();
  }

  private async pumpState(): Promise<void> {
    while (this.buffer.length > 0) {
      const state = await this.loadPending();
      const size = state.size + this.buffer.reduce((acc, x) => acc + guessSize(x), 0);
      const records = state.records.concat(this.buffer);
      const durationMs = (Date.now() - new Date(records[0].timestamp).getTime());
      const uploader = this.uploader.get();
      const needsUpload = ((size > BATCH_SIZE_THRESHOLD) || (durationMs > BATCH_TIME_THRESHOLD));

      try {
        if (needsUpload && (uploader != null)) {
          const batch = {
            timestamp: new Date().toISOString(),
            records,
          }
          uploader.save(uuidv4(), batch, DocumentType.LogBatch, this.priority);
          // uploader is now responsible for this state
          this.buffer.splice(0);
          await this.db.put(this.emptyState());
        } else {
          await this.db.put({ ...state, size, records });
          // PouchDB is now responsible for this state
          this.buffer.splice(0);
        }
      } catch (e) {
        // Hope that the crash log handler can upload a bit of the log state.
        throw new Error(`${e}\nWhile writing log batch:\n${summarize(records)}`);
      }
    }
  }

  private async loadPending(): Promise<PendingLogState> {
    try {
      return await this.db.get(POUCH_DB_KEY);
    } catch (e) {
      return this.emptyState();
    }
  }

  private emptyState(): PendingLogState {
    return {
      _id: POUCH_DB_KEY,
      schemaId: 1,
      size: 0,
      records: [],
    };
  }
}

function guessSize(record: LogRecordInfo): number {
  return record.timestamp.length + record.level.length + record.text.length + PER_RECORD_EXTRA
}

function summarize(records: LogRecordInfo[]): string {
  return records.slice(-40).reduce(
    (acc, x) => acc + `${x.timestamp}: [${x.level}] ${x.text}\n`,
    ""
  )
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
