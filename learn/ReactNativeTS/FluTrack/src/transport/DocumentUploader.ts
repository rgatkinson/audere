// Copyright (c) 2018 by Audere
//
// Use of this source code is governed by an MIT-style license that
// can be found in the LICENSE file distributed with this file.

import { getLogger } from "./LogUtil";
import { AxiosInstance, AxiosResponse } from "axios";
import { InteractionManager } from "react-native";
import {
  DocumentType,
  VisitInfo,
  FeedbackInfo,
  LogInfo,
  ProtocolDocument,
} from "audere-lib";

import { DEVICE_INFO } from "./DeviceInfo";
import { Pump } from "./Pump";
import { PouchDoc } from "./Types";
import { Timer } from "./Timer";
import { summarize } from "./LogUtil";

const logger = getLogger("transport");

const SECOND = 1000;
const MINUTE = 60 * SECOND;
const RETRY_DELAY = 1 * MINUTE;

// exported for testing
export const CSRUID_PLACEHOLDER = "CSRUID_PLACEHOLDER";

type Event = SaveEvent | UploadNextEvent;

type DocumentContents = VisitInfo | FeedbackInfo | LogInfo;

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

// TODO: collapse two pending saves of the same document?
export class DocumentUploader {
  private readonly db: any;
  private readonly api: AxiosInstance;
  private pendingEvents: Event[];
  private readonly timer: Timer;
  private readonly pump: Pump;

  constructor(db: any, api: AxiosInstance) {
    this.db = db;
    this.api = api;
    this.pendingEvents = [];
    this.timer = new Timer(() => this.uploadNext(), RETRY_DELAY);
    this.pump = new Pump(() => this.pumpEvents());
    process.nextTick(() => this.uploadNext());
  }

  public destroy(): void {
    this.db.destroy();
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
    logger.info(`fireEvent "${summarize(event)}"`);
    this.pendingEvents.push(event);
    this.pump.start();
  }

  private async pumpEvents(): Promise<void> {
    if (this.pendingEvents.length === 0) {
      logger.info("pumpEvents: no pending events found");
    }
    while (this.pendingEvents.length > 0) {
      const running = this.pendingEvents;
      this.pendingEvents = [];
      for (let i = 0; i < running.length; i++) {
        await idleness();
        const event = running[i];
        logger.info(`pumpEvents: running[${i}]: ${summarize(event)}`);
        switch (event.type) {
          case "Save":
            await this.handleSave(event);
            break;
          case "UploadNext":
            await this.handleUploadNext();
            break;
        }
      }
    }
  }

  private async handleSave(save: SaveEvent): Promise<void> {
    const key = `documents/${save.priority}/${save.localUid}`;
    let pouch: PouchDoc;
    try {
      pouch = await this.db.get(key);
      pouch.body = protocolDocument(save);
      logger.debug(
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
      logger.debug(
        `Saving new '${key}':\n  ${JSON.stringify(save.document, null, 2)}`
      );
    }
    await this.db.put(pouch);
    logger.debug(`Saved ${key}`);
    this.uploadNext();
  }

  private async handleUploadNext(): Promise<void> {
    logger.debug("handleUploadNext begins");
    let pouch = await this.firstDocument();
    if (pouch == null) {
      logger.debug("Done uploading for now.");
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
      const url = `/documents/${body.csruid}`;
      let result = await this.check200(() => this.api.put(url, body));
      await idleness();
      if (result == null) {
        return;
      }
    }

    // TODO: don't delete when the device is not shared.
    logger.debug(`Removing ${pouch._id}`);
    const obsolete = await this.db.get(pouch._id);
    if (obsolete != null) {
      await this.db.remove(obsolete);
      logger.debug(`Removed ${obsolete._id}`);
    } else {
      logger.warn(`Could not retrieve ${pouch._id} when trying to remove`);
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
    await this.db.put({
      _id: pouchId,
      csruid,
    });

    //TODO(ram): clean up old csruids

    return csruid;
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
      logger.debug(`firstDocument returning null because "${e}"`);
      return null;
    }

    if (items.rows.length < 1) {
      logger.debug("firstDocument returning null because 0 rows");
      return null;
    }

    const item = items.rows[0].doc;
    if (item._id == null || !item._id.startsWith("documents/")) {
      logger.debug(`firstDocument returning null because _id='${item._id}'`);
      return null;
    }

    return item;
  }

  private async logPouchKeys(): Promise<void> {
    const items = await this.db.allDocs({
      include_docs: true,
    });
    logger.debug("Pouch contents:");
    items.rows.forEach((row: any) => {
      logger.debug(`  ${row.doc._id}`);
    });
    logger.debug("End pouch contents");
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
  return (
    typeof contents.subject === "string" && typeof contents.body === "string"
  );
}

function asLogInfo(contents: DocumentContents): LogInfo {
  if (isProbablyLogInfo(contents)) {
    return contents;
  }
  throw new Error(`Expected LogInfo, got ${contents}`);
}

function isProbablyLogInfo(contents: any): contents is LogInfo {
  return typeof contents.logentry === "string";
}
