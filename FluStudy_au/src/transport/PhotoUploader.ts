// Copyright (c) 2019 by Audere
//
// Use of this source code is governed by an MIT-style license that
// can be found in the LICENSE file distributed with this file.

import firebase from "react-native-firebase";
import { NetInfo } from "react-native";
import { InteractionManager } from "react-native";
import { Pump } from "./Pump";
import { Timer } from "./Timer";
import { AppHealthEvents, logDebugEvent } from "../util/tracker";
import { FileSystem } from "expo";
import { IdleManager } from "./IdleManager";

const SECOND = 1000;
const MINUTE = 60 * SECOND;
export const RETRY_DELAY = 1 * MINUTE;

const DEBUG_PHOTO_UPLOADER = process.env.DEBUG_PHOTO_UPLOADER === "true";

// Visible for testing
export const PENDING_DIR = `${
  FileSystem.documentDirectory
}PhotoUploader/pending`;
export const PENDING_DIR_PREFIX = PENDING_DIR + "/";

type FileInfo = {
  exists: boolean;
};

type Event = SaveEvent | UploadNextEvent;

interface SaveEvent {
  type: "SavePhoto";
  photoId: string;
  jpegBase64: string;
}

interface UploadNextEvent {
  type: "UploadNext";
  clearFailures: boolean;
}

export interface Config {
  storage?: FirebaseStorage;
  collection?: string;
}

export interface FirebaseStorage {
  putFile(args: FirebaseStoragePutFileArgs): Promise<void>;
}

export type FirebaseStoragePutFileArgs = {
  filePath: string;
  storagePath: string;
}

export class PhotoUploader {
  private pendingEvents: Event[];
  private readonly failedFiles: Set<string>;
  private readonly timer: Timer;
  private readonly pump: Pump;
  private readonly storage: FirebaseStorage;
  private readonly idle: IdleManager;
  private readonly collection: string;

  constructor(config: Config = {}) {
    this.pendingEvents = [];
    this.failedFiles = new Set();
    this.idle = new IdleManager(false);
    this.storage = config.storage || new DefaultFirebaseStorage();
    this.collection = config.collection || "photos";
    this.pump = new Pump(() => this.pumpEvents());
    this.timer = new Timer(() => this.uploadNext(true), RETRY_DELAY);
    NetInfo.isConnected.addEventListener("connectionChange", connected =>
      this.onConnectionChange(connected)
    );
    process.nextTick(() => this.uploadNext(true));
  }

  public async waitForIdleInTest(): Promise<void> {
    await this.idle.waitForIdle();
  }

  public storagePathFromId(photoId: string): string {
    return `${this.collection}/${photoId}`;
  }

  public savePhoto(photoId: string, jpegBase64: string): void {
    const argSummary = `savePhoto '${photoId}' length=${jpegBase64.length}`;
    debug(argSummary);
    if (!photoId.length || !jpegBase64.length) {
      throw logError("savePhoto", "args", new Error(argSummary));
    }
    this.fireEvent({ type: "SavePhoto", photoId, jpegBase64 });
  }

  private onConnectionChange(connected: boolean) {
    debug(`onConnectionChange ${connected}`);
    if (connected) {
      this.uploadNext(true);
    }
  }

  private uploadNext(clearFailures: boolean) {
    debug(`uploadNext clearFailures=${clearFailures}`);
    this.fireEvent({ type: "UploadNext", clearFailures });
  }

  private fireEvent(event: Event): void {
    this.idle.setBusy();
    this.pendingEvents.push(event);
    this.pump.start();
  }

  private async pumpEvents(): Promise<void> {
    debug("pumpEvents enter");
    try {
      while (this.pendingEvents.length > 0) {
        const running = this.pendingEvents;
        this.pendingEvents = [];
        debug(`pumpEvents processing ${running.length} events`);
        for (let i = 0; i < running.length; i++) {
          await idleness();
          const event = running[i];
          switch (event.type) {
            case "SavePhoto":
              await this.handleSave(event);
              break;
            case "UploadNext":
              await this.handleUploadNext(event);
              break;
          }
        }
      }
    } catch (err) {
      if (!err.logged) {
        debug(`pumpEvents rethrowing unlogged: ${err.name}: ${err.message}`);
        throw err;
      }
    } finally {
      this.idle.setIdle();
    }
    debug("pumpEvents leave");
  }

  private async handleSave(save: SaveEvent): Promise<void> {
    debug("handleSave");
    await this.ensurePendingDir();

    const path = pendingPathFromId(save.photoId);
    await logIfError("handleSave", "writeAsStringAsync", () =>
      FileSystem.writeAsStringAsync(path, save.jpegBase64, {
        encoding: FileSystem.EncodingTypes.Base64,
      })
    );
    await idleness();
    this.uploadNext(false);
  }

  // TODO: an exception stops us until the next timer, but the timer clears failures.
  private async handleUploadNext(upload: UploadNextEvent): Promise<void> {
    debug("handleUploadNext");
    if (upload.clearFailures) {
      this.failedFiles.clear();
    }

    const pendingFiles = await this.pendingFiles();
    await idleness();

    if (pendingFiles.length === 0) {
      debug("pendingFiles.length === 0");
      // No pending photos.
      this.timer.cancel();
      return;
    }
    this.timer.start();

    const filePath = pendingFiles.find(key => !this.failedFiles.has(key));
    if (filePath == null) {
      // All pending photos have failed upload.  Retry when the timer fires.
      debug("filePath == null");
      return;
    }
    // Presumed guilty until found innocent
    this.failedFiles.add(filePath);

    const photoId = pendingIdFromPath(filePath);
    const storagePath = this.storagePathFromId(photoId);
    await logIfError("handleUploadNext", "putFile", () =>
      this.storage.putFile({ filePath, storagePath })
    );
    await idleness();

    await logIfError("handleUploadNext", "deleteAsync", () =>
      FileSystem.deleteAsync(filePath)
    );
    await idleness();

    this.failedFiles.delete(filePath);
    this.uploadNext(false);
  }

  private async pendingFiles(): Promise<string[]> {
    const pendingInfo = await logIfError<FileInfo>(
      "pendingFiles",
      "getInfoAsync",
      () => FileSystem.getInfoAsync(PENDING_DIR)
    );
    if (!pendingInfo.exists) {
      return [];
    }

    const files = await logIfError<string[]>("pendingFiles", "readDirectoryAsync", () =>
      FileSystem.readDirectoryAsync(PENDING_DIR)
    );
    return files.map(x => PENDING_DIR_PREFIX + x);
  }

  private async ensurePendingDir(): Promise<void> {
    const pendingInfo = await logIfError<FileInfo>(
      "ensurePendingDir",
      "getInfoAsync",
      () => FileSystem.getInfoAsync(PENDING_DIR)
    );
    await idleness();
    if (!pendingInfo.exists) {
      debug(`Creating directory '${PENDING_DIR}'`);
      await logIfError("ensurePendingDir", "makeDirectoryAsync", () =>
        FileSystem.makeDirectoryAsync(PENDING_DIR, { intermediates: true })
      );
      await idleness();
    }
  }
}

// To be used as `await idleness()`.
// It's good to do this after returning from an async await in case the user has
// started interacting with the UI in the meantime.
function idleness(): Promise<void> {
  return new Promise(InteractionManager.runAfterInteractions);
}

function debug(s: string) {
  if (DEBUG_PHOTO_UPLOADER) {
    console.log(`PhotoUploader: ${s}`);
  }
}

export function pendingPathFromId(photoId: string): string {
  return PENDING_DIR_PREFIX + photoId;
}

export function pendingIdFromPath(photoPath: string): string {
  if (!photoPath.startsWith(PENDING_DIR_PREFIX)) {
    throw new Error(
      `Expected path to start with '${PENDING_DIR_PREFIX}', got '${photoPath}'`
    );
  }
  return photoPath.substring(PENDING_DIR_PREFIX.length);
}

export class DefaultFirebaseStorage implements FirebaseStorage {
  public async putFile(args: FirebaseStoragePutFileArgs): Promise<void> {
    await firebase
      .storage()
      .ref()
      .child(args.storagePath)
      .putFile(args.filePath, { contentType: "image/jpeg" });
  }
}

async function logIfError<T>(
  func: string,
  location: string,
  call: () => Promise<T>
): Promise<T> {
  try {
    return await call();
  } catch (err) {
    throw logError(func, location, err);
  }
}

function logError(func: string, location: string, err: any): LoggedError {
  const message = err != null ? err.message : "";
  const name = err != null ? err.name : "";
  const summary = `${func}: ${location} threw '${name}': '${message}'`;
  debug(summary);
  logDebugEvent(AppHealthEvents.PHOTO_UPLOADER_ERROR, {
    func,
    location,
    message,
    name,
  });
  return new LoggedError(summary);
}

class LoggedError extends Error {
  readonly logged: boolean;

  constructor(message: string) {
    super(message);
    this.logged = true;
  }
}
