// Copyright (c) 2018 by Audere
//
// Use of this source code is governed by an MIT-style license that
// can be found in the LICENSE file distributed with this file.

import { DocumentType, LogBatchInfo, LogRecordInfo, LogRecordLevel } from "audere-lib/snifflesProtocol";
import { LazyUploader, LogBatcher, ConfigOptions, PendingLogState } from "../../src/transport/LogBatcher";
import { ticks } from "../util";

jest.useFakeTimers();

describe("LogBatcher", () => {

  it("saves small logs locally without uploading", async () => {
    const env = new TestEnv();
    env.bind();
    env.logger.error("abc");
    await ticks(1);
    env.logger.error("abc");
    await ticks(1);

    expect(env.saves).toHaveLength(1);
    expect(env.uploads).toHaveLength(0);
  });

  it("uploads after passing size limit", async () => {
    const env = new TestEnv({targetBatchSizeInChars: 200});
    env.bind();

    const message = "This is a test.  This is only a test.  Had this been an actual message...";

    env.logger.fatal(message);
    env.logger.error(message);
    env.logger.warn(message);
    env.logger.info(message);
    env.logger.debug(message);
    await ticks(1);

    env.logger.debug("something else");
    await ticks(1);

    expect(env.uploads.length).toBeGreaterThan(0);
    const entries = env.uploads.reduce(
      (acc: LogRecordInfo[], entry: LogBatch) => acc.concat(entry.document.records),
      []
    );
    expect(entries.map(entry => entry.level)).toEqual([
      LogRecordLevel.Fatal,
      LogRecordLevel.Error,
      LogRecordLevel.Warn,
      LogRecordLevel.Info,
      LogRecordLevel.Debug,
    ]);
    for (let entry of entries) {
      expect(entry.text).toEqual(message);
    }
  });

  it("does nothing until db is decrypted", async () => {
    const env = new TestEnv({targetBatchSizeInChars: 200, startEncrypted: true});
    env.bind();

    const message = "This is a test.  This is only a test.  Had this been an actual message...";

    env.logger.fatal(message);
    env.logger.error(message);
    env.logger.warn(message);
    env.logger.info(message);
    env.logger.debug(message);
    await ticks(10);

    env.logger.debug("something else");
    await ticks(10);

    expect(env.uploads.length).toEqual(0);
    env.setDbDecrypted();

    env.logger.debug("something else");
    await ticks(10);

    expect(env.uploads.length).toBeGreaterThan(0);
  });
});

interface TestConfigOptions extends ConfigOptions {
  startEncrypted?: boolean;
}

class TestEnv {
  readonly lazy: LazyUploader;
  readonly saves: PendingLogState[] = [];
  readonly uploads: LogBatch[] = [];
  readonly logger: LogBatcher;
  private isDbDecrypted: boolean = false;

  constructor(options: TestConfigOptions = {}) {
    this.lazy = new LazyUploader();
    this.logger = new LogBatcher(this.lazy, this, options);
    this.isDbDecrypted = !options.startEncrypted;
  }

  bind(): void {
    this.lazy.bind(this);
  }

  setDbDecrypted() {
    this.isDbDecrypted = true;
  }

  // LogStore

  async get(key: string): Promise<PendingLogState> {
    if (this.saves.length === 0) {
      throw new Error();
    } else {
      return this.saves[this.saves.length - 1];
    }
  }

  async put(state: PendingLogState): Promise<void> {
    this.saves.push(state);
  }

  // Uploader

  public save(
    localUid: string,
    document: LogBatchInfo,
    documentType: DocumentType,
    priority: number
  ): void {
    this.uploads.push({ localUid, document, documentType, priority });
  }

  public getIsDbDecrypted(): boolean {
    return this.isDbDecrypted;
  }
}

interface LogBatch {
  localUid: string;
  document: LogBatchInfo;
  documentType: DocumentType;
  priority: number;
}
