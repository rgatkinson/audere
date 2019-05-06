// Copyright (c) 2018 by Audere
//
// Use of this source code is governed by an MIT-style license that
// can be found in the LICENSE file distributed with this file.

import PouchDB from "pouchdb-react-native";
import CryptoPouch from "crypto-pouch";
import URL from "url-parse";
import uuidv4 from "uuid/v4";
import { DocumentType, LogLevel, VisitInfo } from "audere-lib/snifflesProtocol";
import { DocumentUploader } from "./DocumentUploader";
import { LazyUploader, LogBatcher } from "./LogBatcher";
import { createAxios, getApiBaseUrl as getApiBaseUrlImpl } from "./Axios";

PouchDB.plugin(CryptoPouch);

interface Transport {
  uploader: TypedDocumentUploader;
  logger: LogBatcher;
}

let db: PouchDB.Database;

export function createTransport(): Transport {
  db = new PouchDB("clientDB", { auto_compaction: true });
  const lazyUploader = new LazyUploader();
  const logger = new LogBatcher(lazyUploader, <any>db, { uploadPriority: 3 });
  const api = createAxios(logger);
  const uploader = new DocumentUploader(db, api, logger);

  lazyUploader.bind(uploader);

  return {
    uploader: new TypedDocumentUploader(uploader),
    logger,
  };
}

class TypedDocumentUploader {
  private readonly uploader: DocumentUploader;

  constructor(uploader: DocumentUploader) {
    this.uploader = uploader;
  }

  public async documentsAwaitingUpload(): Promise<number | null> {
    return this.uploader.documentsAwaitingUpload();
  }

  public async getExistingCSRUIDs(
    localUids: string[]
  ): Promise<Map<string, string>> {
    return this.uploader.getExistingCSRUIDs(localUids);
  }

  public saveVisit(localUid: string, visit: VisitInfo) {
    this.uploader.save(localUid, visit, DocumentType.Visit, 1);
  }

  public saveBackup(localUid: string, visit: VisitInfo) {
    this.uploader.backup(localUid, visit);
  }

  public saveFeedback(subject: string, body: string) {
    this.uploader.save(uuidv4(), { subject, body }, DocumentType.Feedback, 2);
  }

  public saveCrashLog(logentry: string) {
    this.uploader.save(
      uuidv4(),
      { logentry, level: LogLevel.Fatal },
      DocumentType.Log,
      0
    );
  }
}

export function getApiBaseUrl(): string {
  return getApiBaseUrlImpl();
}

export async function syncToCouch(address: string) {
  if (!db) {
    throw new Error("Could not find pouch database, not yet initialized?");
  }
  const remoteDB = new PouchDB(address);
  await new Promise((res, rej) => {
    db.replicate
      .to(remoteDB, {
        filter: doc =>
          doc._id.startsWith("documents/1") || doc._id.startsWith("backup"),
      })
      .on("complete", res)
      .on("error", rej);
  });
}
