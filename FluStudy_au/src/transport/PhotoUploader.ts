// Copyright (c) 2019 by Audere
//
// Use of this source code is governed by an MIT-style license that
// can be found in the LICENSE file distributed with this file.

import firebase from "react-native-firebase";
import { NetInfo } from "react-native";
import { InteractionManager } from "react-native";
import { Pump } from "./Pump";
import { Timer } from "./Timer";
import { AppHealthEvents, tracker, TransportEvents } from "../util/tracker";
import { FileSystem } from "expo";
import { IdleManager } from "./IdleManager";
import { syncPhoto } from "../store/FirebaseStore";

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
}

export interface Config {
  storage?: FirebaseStorage;
  network?: NetInfoIsConnected;
  collection?: string;
}

export interface FirebaseStorage {
  putFile(args: FirebaseStoragePutFileArgs): Promise<void>;
}

export type FirebaseStoragePutFileArgs = {
  filePath: string;
  storagePath: string;
};

export interface NetInfoIsConnected {
  addEventListener(
    eventName: string,
    listener: NetInfoIsConnectedListener
  ): void;
  fetch(): Promise<boolean>;
}

export interface NetInfoIsConnectedListener {
  (connected: boolean): void;
}

export class PhotoUploader {
  private pendingEvents: Event[];
  private readonly failedFiles: Set<string>;
  private readonly timer: Timer;
  private readonly pump: Pump;
  private readonly storage: FirebaseStorage;
  private readonly network: NetInfoIsConnected;
  private readonly idle: IdleManager;
  private readonly collection: string;

  constructor(config: Config = {}) {
    this.pendingEvents = [];
    this.failedFiles = new Set();
    this.idle = new IdleManager(false);
    this.storage = config.storage || new DefaultFirebaseStorage();
    this.network = config.network || NetInfo.isConnected;
    this.collection = config.collection || "photos";
    this.pump = new Pump(() => this.pumpEvents());
    this.timer = new Timer(() => this.uploadNext(), RETRY_DELAY);
    this.network.addEventListener("connectionChange", connected =>
      this.onConnectionChange(connected)
    );
    process.nextTick(() => this.uploadNext());
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
      this.uploadNext();
    }
  }

  private uploadNext() {
    debug("uploadNext");
    this.fireEvent({ type: "UploadNext" });
  }

  private fireEvent(event: Event): void {
    this.idle.setBusy();
    this.pendingEvents.push(event);
    this.pump.start();
  }

  private async pumpEvents(): Promise<void> {
    debug("pumpEvents enter");
    while (this.pendingEvents.length > 0) {
      const running = this.pendingEvents;
      this.pendingEvents = [];
      debug(`pumpEvents processing ${running.length} events`);
      for (let i = 0; i < running.length; i++) {
        await idleness();
        const event = running[i];
        try {
          switch (event.type) {
            case "SavePhoto":
              await this.handleSave(event);
              break;
            case "UploadNext":
              await this.handleUploadNext();
              break;
          }
        } catch (err) {
          if (!err.logged) {
            logError("pumpEvents", "unknown", err);
            throw err;
          }
        }
      }
    }
    this.idle.setIdle();
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
    this.uploadNext();
  }

  private async handleUploadNext(): Promise<void> {
    debug("handleUploadNext");

    // Ensure we keep retrying until we have no pending photos.
    this.timer.start();

    const pendingFiles = await this.pendingFiles();
    await idleness();

    if (pendingFiles.length === 0) {
      debug("No pending photos, resetting state to dormant");
      // No pending photos, so reset state.
      this.failedFiles.clear();
      this.timer.cancel();
      return;
    }

    const isConnected = await this.network.fetch();
    if (!isConnected) {
      debug("Currently offline, so nothing to do.");
      return;
    }

    const filePath = pendingFiles.find(key => !this.failedFiles.has(key));
    if (filePath == null) {
      // All pending photos have failed upload.  Retry when the timer fires or
      // when the network comes back up.
      debug(
        "All pending photos are marked as failed.  Waiting to retry later."
      );
      this.failedFiles.clear();
      return;
    }

    // Any errors on this file should not affect whether we try uploading other files.
    try {
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
      tracker.logEvent(TransportEvents.PHOTO_UPLOADED, {
        photoId,
        storagePath,
      });

      await syncPhoto(photoId);
    } catch (err) {
      this.failedFiles.add(filePath);
    }

    this.uploadNext();
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

    const files = await logIfError<string[]>(
      "pendingFiles",
      "readDirectoryAsync",
      () => FileSystem.readDirectoryAsync(PENDING_DIR)
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
    if ((err as any).logged) {
      throw err;
    } else {
      throw logError(func, location, err);
    }
  }
}

function logError(func: string, location: string, err: any): LoggedError {
  const message = err != null ? err.message : "";
  const name = err != null ? err.name : "";
  const summary = `${func}: ${location} threw '${name}': '${message}'`;
  debug(summary);
  tracker.logEvent(AppHealthEvents.PHOTO_UPLOADER_ERROR, {
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
