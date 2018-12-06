// Copyright (c) 2018 by Audere
//
// Use of this source code is governed by an MIT-style license that
// can be found in the LICENSE file distributed with this file.

import { getLogger } from "./LogUtil";
import { AxiosInstance, AxiosResponse } from "axios";
import { InteractionManager } from "react-native";
import { DocumentType } from "audere-lib";

import { DEVICE_INFO } from "./DeviceInfo";
import { Pump } from "./Pump";
import { PouchDoc, UploadDoc } from "./Types";
import { Timer } from "./Timer";
import { summarize } from "./LogUtil";

const logger = getLogger("transport");

const SECOND = 1000;
const MINUTE = 60 * SECOND;
const RETRY_DELAY = 1 * MINUTE;

type Event = SaveEvent | UploadNextEvent;

interface SaveEvent {
  type: "Save";
  localUid: string;
  document: UploadDoc;
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
    document: UploadDoc,
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
      pouch.body.device = DEVICE_INFO;
      pouch.body.document = save.document;
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
        body: {
          csruid: null,
          documentType: save.documentType,
          // Assign device info at save time rather than upload time,
          // in case version info changes between the two.
          device: DEVICE_INFO,
          document: save.document,
        },
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

    // TODO: get enough ids for all the documents that don't have one.
    if (pouch.body.csruid != null) {
      logger.debug(`csruid loaded for '${pouch._id}': '${pouch.body.csruid}`);
    } else {
      logger.debug(`Requesting csruid for '${pouch._id}'`);
      const result = await this.check200(() => this.api.get(`/documentId`));
      await idleness();
      if (result == null) {
        return;
      }

      logger.debug(`csruid data: "${result.data.id}"`);
      const csruid = result.data.id.trim();
      logger.debug(`Saving csruid for "${pouch._id}": "${csruid}"`);
      pouch.body.csruid = csruid;

      await this.db.put(pouch);
      logger.debug(`Saved "${pouch._id}"`);
      await idleness();
    }

    {
      const body = pouch.body;
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

    if (items.total_rows < 1) {
      logger.debug("firstDocument returning null because 0 rows");
      return null;
    }

    const item = items.rows[0].doc;
    if (item._id == null || !item._id.startsWith("documents/")) {
      logger.debug(`firstDocument returning null because _id='${item._id}'`);
      return null;
    }

    //logger.debug(`firstDocument returning:\n${JSON.stringify(item, null, 2)}`);
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
