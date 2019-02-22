// Copyright (c) 2018 by Audere
//
// Use of this source code is governed by an MIT-style license that
// can be found in the LICENSE file distributed with this file.

import { DocumentType, AnalyticsInfo, LogRecordInfo, LogRecordLevel, EventInfoKind } from "audere-lib/feverProtocol";
import { LazyUploader, AnalyticsBatcher, ConfigOptions, PendingState } from "../../src/transport/AnalyticsBatcher";
import { ticks } from "../util";
import { newCSRUID } from "../../src/util/csruid";

jest.useFakeTimers();

jest.mock("../../src/util/csruid");
(<any>newCSRUID).mockImplementation(async () => "CSRUID");

describe("AnalyticsBatcher", () => {

  it("saves small logs locally without uploading", async () => {
    const env = new TestEnv();
    env.bind();
    env.logger.error("abc");
    await ticks(5);

    expect(env.saves.length).toBeGreaterThan(0);
    expect(env.uploads).toHaveLength(0);
  });

  it("saves small events locally without uploading", async () => {
    const env = new TestEnv();
    env.bind();
    env.logger.fire({ kind: EventInfoKind.AppNav, at: "timestamp" });
    await ticks(5);

    expect(env.saves.length).toBeGreaterThan(0);
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
    jest.runAllTimers();
    await ticks(5);

    env.logger.debug("something else");
    await ticks(5);

    expect(env.uploads.length).toBeGreaterThan(0);
    const entries = env.uploads.reduce(
      (acc: LogRecordInfo[], entry: Analytics) => acc.concat(entry.document.logs),
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
});

class TestEnv {
  readonly lazy: LazyUploader;
  readonly saves: PendingState[] = [];
  readonly uploads: Analytics[] = [];
  readonly logger: AnalyticsBatcher;

  constructor(options: ConfigOptions = {}) {
    this.lazy = new LazyUploader();
    this.logger = new AnalyticsBatcher(this.lazy, this, options);
  }

  bind(): void {
    this.lazy.bind(this);
  }

  // LogStore

  async get(key: string): Promise<PendingState> {
    if (this.saves.length === 0) {
      throw new Error();
    } else {
      return this.saves[this.saves.length - 1];
    }
  }

  async put(state: PendingState): Promise<void> {
    this.saves.push(state);
  }

  // Uploader

  public save(
    csruid: string,
    document: AnalyticsInfo,
    documentType: DocumentType,
    priority: number
  ): void {
    this.uploads.push({ csruid, document, documentType, priority });
  }
}

interface Analytics {
  csruid: string;
  document: AnalyticsInfo;
  documentType: DocumentType;
  priority: number;
}
