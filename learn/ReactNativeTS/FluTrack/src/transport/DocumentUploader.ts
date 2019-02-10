// Copyright (c) 2018 by Audere
//
// Use of this source code is governed by an MIT-style license that
// can be found in the LICENSE file distributed with this file.

import base64url from "base64url";
import bufferXor from "buffer-xor";
import { SecureStore } from "expo";
import { AxiosInstance, AxiosResponse } from "axios";
import { InteractionManager } from "react-native";
import {
  DocumentType,
  LogBatchInfo,
  VisitInfo,
  FeedbackInfo,
  LogInfo,
  ProtocolDocument,
} from "audere-lib/snifflesProtocol";
import { loadRandomBytes } from "../hacks";
import { DEVICE_INFO } from "./DeviceInfo";
import { Pump } from "./Pump";
import { PouchDoc } from "./Types";
import { Timer } from "./Timer";
import { Logger, summarize } from "./LogUtil";

const SECOND = 1000;
const MINUTE = 60 * SECOND;
const RETRY_DELAY = 1 * MINUTE;

// exported for testing
export const CSRUID_PLACEHOLDER = "CSRUID_PLACEHOLDER";

const POUCH_PASS_KEY = "FluTrack.PouchDbEncryptionPassword";

type Event = DecryptDBEvent | SaveEvent | UploadNextEvent;

type DocumentContents = VisitInfo | FeedbackInfo | LogInfo | LogBatchInfo;

interface SaveEvent {
  type: "Save";
  localUid: string;
  document: DocumentContents;
  priority: number;
  documentType: DocumentType;
}

interface UploadNextEvent {
  type: "UploadNext";
}

interface DecryptDBEvent {
  type: "DecryptDBEvent";
}

// TODO: collapse two pending saves of the same document?
export class DocumentUploader {
  private readonly db: any;
  private readonly api: AxiosInstance;
  private readonly documentUploadKey: string;
  private pendingEvents: Event[];
  private readonly timer: Timer;
  private readonly pump: Pump;
  private readonly logger: Logger;

  constructor(db: any, api: AxiosInstance, logger: Logger) {
    this.db = db;
    this.api = api;
    this.logger = logger;
    this.documentUploadKey = this.getDocumentUploadKey();
    this.pendingEvents = [{ type: "DecryptDBEvent" }, { type: "UploadNext" }];
    this.timer = new Timer(() => this.uploadNext(), RETRY_DELAY);
    this.pump = new Pump(() => this.pumpEvents(), logger);
    process.nextTick(() => this.pump.start());
  }

  public save(
    localUid: string,
    document: DocumentContents,
    documentType: DocumentType,
    priority: number
  ): void {
    this.fireEvent({
      type: "Save",
      localUid,
      document,
      documentType,
      priority,
    });
  }

  private uploadNext() {
    this.fireEvent({ type: "UploadNext" });
  }

  private fireEvent(event: Event): void {
    this.logger.info(`fireEvent "${summarize(event)}"`);
    this.pendingEvents.push(event);
    this.pump.start();
  }

  private async pumpEvents(): Promise<void> {
    if (this.pendingEvents.length === 0) {
      this.logger.info("pumpEvents: no pending events found");
    }
    while (this.pendingEvents.length > 0) {
      const running = this.pendingEvents;
      this.pendingEvents = [];
      for (let i = 0; i < running.length; i++) {
        await idleness();
        const event = running[i];
        this.logger.info(`pumpEvents: running[${i}]: ${summarize(event)}`);
        switch (event.type) {
          case "Save":
            await this.handleSave(event);
            break;
          case "UploadNext":
            await this.handleUploadNext();
            break;
          case "DecryptDBEvent":
            await this.handleDecryptDB();
            break;
        }
      }
    }
  }

  private async getEncryptionPassword(): Promise<string> {
    let pouchPassword = await SecureStore.getItemAsync(POUCH_PASS_KEY);
    if (pouchPassword) {
      return pouchPassword;
    }
    const result = await this.check200(() => this.api.get("/randomBytes/32"));
    if (!result) {
      throw new Error(
        "Failed to initialize PouchDB, could not fetch a random password"
      );
    }
    pouchPassword = result.data.bytes.trim();
    await SecureStore.setItemAsync(POUCH_PASS_KEY, pouchPassword);
    return pouchPassword;
  }

  private async handleDecryptDB(): Promise<void> {
    this.db.crypto(await this.getEncryptionPassword(), {
      algorithm: "chacha20",
    });
  }

  private async handleSave(save: SaveEvent): Promise<void> {
    const key = `documents/${save.priority}/${save.localUid}`;
    let pouch: PouchDoc;
    try {
      pouch = await this.db.get(key);
      pouch.body = protocolDocument(save);
      this.logger.debug(
        `Updating existing '${key}':\n  ${JSON.stringify(
          save.document,
          null,
          2
        )}`
      );
    } catch (e) {
      pouch = {
        _id: key,
        body: protocolDocument(save),
      };
      this.logger.debug(
        `Saving new '${key}':\n  ${JSON.stringify(save.document, null, 2)}`
      );
    }
    await loadRandomBytes(this.api, 44, this.logger);
    await this.db.put(pouch);
    this.logger.debug(`Saved ${key}`);
    this.uploadNext();
  }

  private async handleUploadNext(): Promise<void> {
    this.logger.debug("handleUploadNext begins");
    let pouch = await this.firstDocument();
    if (pouch == null) {
      this.logger.debug("Done uploading for now.");
      // No pending documents--done until next save().
      this.timer.cancel();
      return;
    }
    await idleness();

    // Until we know there are no more documents to upload, we want a retry timer pending.
    this.timer.start();

    pouch.body.csruid = await this.getCSRUID(pouch._id);

    {
      const body = pouch.body;
      if (body.csruid === CSRUID_PLACEHOLDER) {
        throw new Error("Expected body.csruid to be initialized by this point");
      }
      const url = `/documents/${this.documentUploadKey}/${body.csruid}`;
      let result = await this.check200(() => this.api.put(url, body));
      await idleness();
      if (result == null) {
        return;
      }
    }

    // TODO: don't delete when the device is not shared.
    this.logger.debug(`Removing ${pouch._id}`);
    const obsolete = await this.db.get(pouch._id);
    if (obsolete != null) {
      await this.db.remove(obsolete);
      this.logger.debug(`Removed ${obsolete._id}`);
    } else {
      this.logger.warn(`Could not retrieve ${pouch._id} when trying to remove`);
    }
    await idleness();

    this.uploadNext();
  }

  private async getCSRUID(localUid: string) {
    const pouchId = "csruid/" + localUid;
    try {
      const pouchResult = await this.db.get(pouchId);
      return pouchResult.csruid;
    } catch {}
    const apiResult = await this.check200(() => this.api.get(`/documentId`));
    if (apiResult === null) {
      throw new Error("Unable to retrieve CSRUID");
    }
    const csruid = apiResult.data.id.trim();
    await loadRandomBytes(this.api, 44, this.logger);
    await this.db.put({
      _id: pouchId,
      csruid,
    });

    //TODO(ram): clean up old csruids

    return csruid;
  }

  public async documentsAwaitingUpload(): Promise<number | null> {
    const options = {
      startkey: "documents/",
    };

    let items: any;
    try {
      items = await this.db.allDocs(options);
    } catch (e) {
      this.logger.debug(
        `documentsAwaitingUpload returning null because "${e}"`
      );
      return null;
    }
    return items.rows.length;
  }

  private async firstDocument(): Promise<PouchDoc | null> {
    const options = {
      startkey: "documents/",
      limit: 1,
      include_docs: true,
    };

    await this.logPouchKeys();

    let items: any;
    try {
      items = await this.db.allDocs(options);
    } catch (e) {
      this.logger.debug(`firstDocument returning null because "${e}"`);
      return null;
    }

    if (items.rows.length < 1) {
      this.logger.debug("firstDocument returning null because 0 rows");
      return null;
    }

    const item = items.rows[0].doc;
    if (item._id == null || !item._id.startsWith("documents/")) {
      this.logger.debug(
        `firstDocument returning null because _id='${item._id}'`
      );
      return null;
    }

    return item;
  }

  private async logPouchKeys(): Promise<void> {
    const items = await this.db.allDocs({ include_docs: true });
    if (items && items.rows) {
      const total = items.rows.length;
      const docs = items.rows.filter((row: any) =>
        row.doc._id.startsWith("documents/")
      ).length;
      const csruids = items.rows.filter((row: any) =>
        row.doc._id.startsWith("csruid/documents/")
      ).length;
      this.logger.debug(
        `Pouch contents: ` +
          `${total} entries, of which ${docs} docs and ${csruids} csruids` +
          items.rows.map((row: any) => `\n  ${row.doc._id}`)
      );
    } else {
      this.logger.debug("Pouch contents: no items found");
    }
  }

  private async check200(
    action: () => Promise<AxiosResponse>
  ): Promise<AxiosResponse | null> {
    try {
      const result = await action();
      if (result.status === 200) {
        return result;
      }
    } catch (e) {}
    return null;
  }

  getDocumentUploadKey(): string {
    if (!process.env.ACCESS_KEY_A || !process.env.ACCESS_KEY_B) {
      this.logger.warn(
        "Both ACCESS_KEY_A and ACCESS_KEY_B should be defined in your .env file. " +
          "Copy .env.example to .env if you have not yet done so."
      );
    }
    const components = [
      "X12ct9Go-AqgxyjnuCT4uOHFFokVfnB03BXo3vxw_TEQVBAaK53Kkk74mEwU5Nuw",
      process.env.ACCESS_KEY_A || "",
      process.env.ACCESS_KEY_B || "",
    ];
    const buffers = components.map(base64url.toBuffer);
    const buffer = buffers.reduce(bufferXor, new Buffer(0));
    return base64url(buffer);
  }
}

// To be used as `await idleness()`.
function idleness(): Promise<void> {
  return new Promise(InteractionManager.runAfterInteractions);
}

function protocolDocument(save: SaveEvent): ProtocolDocument {
  switch (save.documentType) {
    case DocumentType.Visit:
      return {
        documentType: save.documentType,
        schemaId: 1,
        csruid: CSRUID_PLACEHOLDER,
        device: DEVICE_INFO,
        visit: asVisitInfo(save.document),
      };

    case DocumentType.Feedback:
      return {
        documentType: save.documentType,
        schemaId: 1,
        device: DEVICE_INFO,
        csruid: CSRUID_PLACEHOLDER,
        feedback: asFeedbackInfo(save.document),
      };

    case DocumentType.Log:
      return {
        documentType: save.documentType,
        schemaId: 1,
        device: DEVICE_INFO,
        csruid: CSRUID_PLACEHOLDER,
        log: asLogInfo(save.document),
      };

    case DocumentType.LogBatch:
      return {
        documentType: save.documentType,
        schemaId: 1,
        device: DEVICE_INFO,
        csruid: CSRUID_PLACEHOLDER,
        batch: asLogBatchInfo(save.document),
      };
  }
}

function asVisitInfo(contents: DocumentContents): VisitInfo {
  if (isProbablyVisitInfo(contents)) {
    return contents;
  }
  throw new Error(`Expected VisitInfo, got ${contents}`);
}

function isProbablyVisitInfo(contents: any): contents is VisitInfo {
  return (
    typeof contents.complete === "boolean" &&
    typeof contents.samples === "object" &&
    typeof contents.patient === "object" &&
    typeof contents.consents === "object" &&
    typeof contents.responses === "object" &&
    typeof contents.events === "object"
  );
}

function asFeedbackInfo(contents: DocumentContents): FeedbackInfo {
  if (isProbablyFeedbackInfo(contents)) {
    return contents;
  }
  throw new Error(`Expected FeedbackInfo, got ${contents}`);
}

function isProbablyFeedbackInfo(contents: any): contents is FeedbackInfo {
  return isStr(contents.subject) && isStr(contents.body);
}

function asLogInfo(contents: DocumentContents): LogInfo {
  if (isProbablyLogInfo(contents)) {
    return contents;
  }
  throw new Error(`Expected LogInfo, got ${contents}`);
}

function isProbablyLogInfo(contents: any): contents is LogInfo {
  return isStr(contents.logentry);
}

function asLogBatchInfo(contents: DocumentContents): LogBatchInfo {
  if (isProbablyLogBatchInfo(contents)) {
    return contents;
  }
  throw new Error(`Expected LogBatchInfo, got ${contents}`);
}

function isProbablyLogBatchInfo(contents: any): contents is LogBatchInfo {
  return (
    isArr(contents.records) &&
    contents.records.every(
      (item: any) =>
        isObj(item) &&
        isStr(item.timestamp) &&
        isStr(item.level) &&
        isStr(item.text)
    )
  );
}

function isArr(x: any) {
  return isObj(x) && isFn(x.every);
}
function isObj(x: any) {
  return typeof x === "object";
}
function isStr(x: any) {
  return typeof x === "string";
}
function isFn(x: any) {
  return typeof x === "function";
}
