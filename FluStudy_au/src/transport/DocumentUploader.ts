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
  SurveyInfo,
  ProtocolDocument,
  PhotoInfo,
} from "audere-lib/coughProtocol";
import { DEVICE_INFO } from "./DeviceInfo";
import { Pump } from "./Pump";
import { Timer } from "./Timer";
import { truncatingReplacer } from "./LogUtil";
import {
  UniformObject,
  DocumentContents,
  PouchDoc,
  PouchAttachmentObject,
} from "./Types";
import { createAccessKey } from "../util/accessKey";

const SECOND = 1000;
const MINUTE = 60 * SECOND;
const RETRY_DELAY = 1 * MINUTE;

const POUCH_PASS_KEY = "FluAtHome.PouchDbEncryptionPassword";

const IS_NODE_ENV_DEVELOPMENT = process.env.NODE_ENV === "development";

type Event = DecryptDBEvent | SaveEvent | UploadNextEvent;

// Values are base64 encoded strings.
//
// At rest, attachments are stored (unencrypted) as
// a PouchDB attachment.
//
// During upload, values here overwrite the corresponding
// keys in the document.
type UploadAttachments = UniformObject<string>;

interface SaveEvent {
  type: "Save";
  docId: string;
  document: DocumentContents;
  priority: number;
  documentType: DocumentType;
  attachments?: UploadAttachments;
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

  constructor(db: any, api: AxiosInstance) {
    this.db = db;
    this.api = api;
    this.documentUploadKey = createAccessKey();
    this.pendingEvents = [{ type: "DecryptDBEvent" }, { type: "UploadNext" }];
    this.timer = new Timer(() => this.uploadNext(), RETRY_DELAY);
    this.pump = new Pump(() => this.pumpEvents());
    process.nextTick(() => this.pump.start());
  }

  public save(
    docId: string,
    document: DocumentContents,
    documentType: DocumentType,
    priority: number,
    attachments?: UploadAttachments
  ): void {
    this.fireEvent({
      type: "Save",
      docId,
      document,
      documentType,
      priority,
      attachments,
    });
  }

  private uploadNext() {
    this.fireEvent({ type: "UploadNext" });
  }

  private fireEvent(event: Event): void {
    this.pendingEvents.push(event);
    this.pump.start();
  }

  private async pumpEvents(): Promise<void> {
    while (this.pendingEvents.length > 0) {
      const running = this.pendingEvents;
      this.pendingEvents = [];
      for (let i = 0; i < running.length; i++) {
        await idleness();
        const event = running[i];
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

  public async getEncryptionPassword(): Promise<string> {
    let pouchPassword;
    try {
      pouchPassword = await SecureStore.getItemAsync(POUCH_PASS_KEY);
      if (pouchPassword) {
        return pouchPassword;
      }
    } catch (e) {}
    pouchPassword = base64url(crypto.getRandomValues(new Buffer(32)));
    await SecureStore.setItemAsync(POUCH_PASS_KEY, pouchPassword);
    return pouchPassword;
  }

  private async handleDecryptDB(): Promise<void> {
    this.db.crypto(await this.getEncryptionPassword(), {
      algorithm: "chacha20",
      ignore: "_attachments",
    });
  }

  private async handleSave(save: SaveEvent): Promise<void> {
    const key = `documents/${save.priority}/${save.docId}`;
    const attachments = this.attachmentsToPouch(save.attachments);
    const { docId, document, documentType } = save;
    let pouch: PouchDoc;
    try {
      pouch = {
        ...(await this.db.get(key)),
        document,
        documentType,
        ...attachments,
      };
    } catch (e) {
      pouch = {
        _id: key,
        docId,
        document,
        documentType,
        ...attachments,
      };
    }
    if (IS_NODE_ENV_DEVELOPMENT) {
      console.log("=== Begin save document ===");
      console.log(JSON.stringify(pouch, truncatingReplacer(100)));
      console.log("=== End save document ===");
    }
    await this.db.put(pouch);
    this.uploadNext();
  }

  private async handleUploadNext(): Promise<void> {
    let pouch = await this.firstDocument();
    if (pouch == null) {
      // No pending documents--done until next save().
      this.timer.cancel();
      return;
    }
    await idleness();

    // Until we know there are no more documents to upload, we want a retry timer pending.
    this.timer.start();

    if (IS_NODE_ENV_DEVELOPMENT) {
      console.log("=== Begin loaded pouch document ===");
      console.log(JSON.stringify(pouch, truncatingReplacer(100)));
      console.log("=== End loaded pouch document ===");
    }

    {
      const upload = protocolDocument(pouch);

      if (IS_NODE_ENV_DEVELOPMENT) {
        console.log("=== Begin upload document ===");
        console.log(JSON.stringify(upload, truncatingReplacer(100)));
        console.log("=== End upload document ===");
      }

      const url = `/fever/documents/${this.documentUploadKey}/${upload.docId}`;
      let result = await this.check200(() => this.api.put(url, upload));
      await idleness();

      if (result == null) {
        return;
      }
    }

    // TODO: don't delete when the device is not shared.
    const obsolete = await this.db.get(pouch._id);
    if (obsolete != null) {
      await this.db.remove(obsolete);
    }
    await idleness();

    this.uploadNext();
  }

  public async documentsAwaitingUpload(): Promise<number | null> {
    const options = {
      startkey: "documents/",
    };

    let items: any;
    try {
      items = await this.db.allDocs(options);
    } catch (e) {
      return null;
    }
    return items.rows.length;
  }

  private async firstDocument(): Promise<PouchDoc | null> {
    const options = {
      startkey: "documents/",
      limit: 1,
      include_docs: true,
      attachments: true,
    };

    await this.logPouchKeys();

    let items: any;
    try {
      items = await this.db.allDocs(options);
    } catch (e) {
      return null;
    }

    if (items.rows.length < 1) {
      return null;
    }

    const item = items.rows[0].doc;
    if (item._id == null || !item._id.startsWith("documents/")) {
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
      if (IS_NODE_ENV_DEVELOPMENT) {
        console.log(items.rows.map((row: any) => `\n  ${row.id}`));
      }
    }
  }

  private attachmentsToPouch(
    attachments?: UploadAttachments
  ): { _attachments: PouchAttachmentObject } | {} {
    return attachments == null
      ? {}
      : {
          _attachments: this.mapAttachments(
            data => ({ content_type: "text/plain", data }),
            attachments
          ),
        };
  }

  private mapAttachments<I, O>(
    mapItem: (x: I) => O,
    attachments?: UniformObject<I>
  ): UniformObject<O> {
    if (attachments == null) {
      console.log("No attachments");
      return {};
    } else {
      const o: UniformObject<O> = {};
      Object.keys(attachments).forEach(k => {
        if (IS_NODE_ENV_DEVELOPMENT) {
          console.log(`mapAttachment ${k}:`);
          console.log(
            `  from ${JSON.stringify(attachments[k], truncatingReplacer(50))}`
          );
          console.log(
            `    to ${JSON.stringify(
              mapItem(attachments[k]),
              truncatingReplacer(50)
            )}`
          );
        }
        return (o[k] = mapItem(attachments[k]));
      });
      return o;
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
}

// To be used as `await idleness()`.
function idleness(): Promise<void> {
  return new Promise(InteractionManager.runAfterInteractions);
}

function protocolDocument(save: PouchDoc): ProtocolDocument {
  switch (save.documentType) {
    case DocumentType.Survey:
      return {
        documentType: save.documentType,
        schemaId: 1,
        docId: save.docId,
        device: DEVICE_INFO,
        survey: asSurveyInfo(save.document),
      };
    case DocumentType.Photo: {
      return {
        documentType: save.documentType,
        schemaId: 1,
        device: DEVICE_INFO,
        docId: save.docId,
        photo: {
          ...asPhotoInfo(save.document),
          jpegBase64: save._attachments!.jpegBase64.data,
        },
      };
    }
  }
}

function asSurveyInfo(contents: DocumentContents): SurveyInfo {
  if (isProbablySurveyInfo(contents)) {
    return contents;
  }
  throw new Error(`Expected SurveyInfo, got ${contents}`);
}

function isProbablySurveyInfo(contents: any): contents is SurveyInfo {
  return (
    isObj(contents.samples) &&
    isObj(contents.consents) &&
    isObj(contents.responses) &&
    isObj(contents.events) &&
    isObj(contents.workflow)
  );
}

function asPhotoInfo(contents: DocumentContents): PhotoInfo {
  if (isProbablyPhotoInfo(contents)) {
    return contents;
  }
  throw new Error(`Expected PhotoInfo, got ${contents}`);
}

function isProbablyPhotoInfo(contents: any): contents is PhotoInfo {
  return isStr(contents.timestamp) && isStr(contents.jpegBase64);
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
