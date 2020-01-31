// Copyright (c) 2019 by Audere
//
// Use of this source code is governed by an MIT-style license that
// can be found in the LICENSE file distributed with this file.

import NetInfo from "@react-native-community/netinfo";
import { InteractionManager } from "react-native";
import { Pump } from "./Pump";
import { Timer } from "./Timer";
import { IdleManager } from "./IdleManager";
import { UploadQueue, createUploadQueue } from "./FirebaseUploadHelper";
import { logError, logIfAsyncError } from "../util/AsyncError";
import { syncPhoto } from "../store/FirebaseStore";
import { getRemoteConfig } from "../util/remoteConfig";

const DEBUG_PHOTO_UPLOADER = process.env.DEBUG_PHOTO_UPLOADER === "true";

const SECOND = 1000;
const MINUTE = 60 * SECOND;
export const RETRY_DELAY = 1 * MINUTE;

type Event = EnqueueFileContentsEvent | UploadNextEvent;

interface EnqueueFileContentsEvent {
  type: "EnqueueFileContents";
  photoId: string;
  filepath: string;
  removeOriginal: boolean;
}

interface UploadNextEvent {
  type: "UploadNext";
}

export interface Config {
  network?: NetInfoIsConnected;
  collection?: string;
  queue?: UploadQueue;
}

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
  private readonly network: NetInfoIsConnected;
  private readonly idle: IdleManager;
  private readonly queue: UploadQueue;

  constructor(config: Config = {}) {
    this.pendingEvents = [];
    this.failedFiles = new Set();
    this.idle = new IdleManager(false);
    this.network = config.network || NetInfo.isConnected;
    this.queue =
      config.queue || createUploadQueue(config.collection || "photos");
    this.pump = new Pump(() => this.pumpEvents());
    this.timer = new Timer(() => this.uploadNext(), RETRY_DELAY);
    this.network.addEventListener("connectionChange", connected =>
      this.onConnectionChange(connected)
    );
    process.nextTick(() => this.uploadNext());
  }

  public async waitForIdle(ms?: number): Promise<void> {
    await this.idle.waitForIdle(ms);
  }

  public enqueuePreviewContents(
    photoId: string,
    filepath: string,
    frameIndex: number
  ): void {
    const sampleRate = getRemoteConfig("previewFramesSampleRate");
    if (sampleRate > 0 && frameIndex % sampleRate == 0) {
      const argSummary = `enqueuePreviewContents '${photoId}' path='${filepath}'`;
      debug(argSummary);
      if (!photoId.length || !filepath.length) {
        throw logError("enqueuePreviewContents.args", new Error(argSummary));
      }
      this.fireEvent({
        type: "EnqueueFileContents",
        photoId,
        filepath,
        removeOriginal: true,
      });
    } else {
      this.queue.deleteFile(filepath);
    }
  }

  public enqueueFileContents(photoId: string, filepath: string): void {
    const argSummary = `enqueueFileContents '${photoId}' path='${filepath}'`;
    debug(argSummary);
    if (!photoId.length || !filepath.length) {
      throw logError("enqueueFileContents.args", new Error(argSummary));
    }
    this.fireEvent({
      type: "EnqueueFileContents",
      photoId,
      filepath,
      removeOriginal: false,
    });
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
            case "EnqueueFileContents":
              await this.handleEnqueueFileContents(event);
              break;
            case "UploadNext":
              await this.handleUploadNext();
              break;
          }
        } catch (err) {
          if (!err.logged) {
            logError("PhotoUploader.pumpEvents:unknown", err);
            throw err;
          }
        }
      }
    }
    this.idle.setIdle();
    debug("pumpEvents leave");
  }

  private async handleEnqueueFileContents(
    enqueue: EnqueueFileContentsEvent
  ): Promise<void> {
    await logIfAsyncError(
      "PhotoUploader.handleEnqueueFileContents:queue.add",
      () =>
        this.queue.add(
          enqueue.photoId,
          enqueue.filepath,
          enqueue.removeOriginal
        )
    );
    await idleness();
    this.uploadNext();
  }

  async hasPendingPhotos() {
    return (await this.pendingPhotoIds()).length > 0;
  }

  private async handleUploadNext(): Promise<void> {
    debug("handleUploadNext");

    // Ensure we keep retrying until we have no pending photos.
    this.timer.start();

    const pendingPhotoIds = await this.pendingPhotoIds();
    await idleness();

    if (pendingPhotoIds.length === 0) {
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

    const photoId = pendingPhotoIds.find(key => !this.failedFiles.has(key));
    if (photoId == null) {
      // All pending photos have failed upload.  Retry when the timer fires or
      // when the network comes back up.
      debug(
        "All pending photos are marked as failed.  Waiting to retry later."
      );

      if (DEBUG_PHOTO_UPLOADER) {
        debug("pending photo ids:");
        pendingPhotoIds.forEach(x => debug(`  ${x}`));
        debug("failed files:");
        this.failedFiles.forEach(x => debug(`  ${x}`));
      }

      this.failedFiles.clear();
      return;
    }

    // Any errors on this file should not affect whether we try uploading other files.
    try {
      debug(`Uploading ${photoId}`);
      await logIfAsyncError("PhotoUploader.handleUploadNext:upload", () =>
        this.queue.upload(photoId)
      );
      await idleness();
    } catch (err) {
      debug(`Got error calling upload: ${err}`);
      this.failedFiles.add(photoId);
    }

    // TODO: the queue should have separate upload/remove operations, and this should go
    // between so we keep the file around if this fails.
    await logIfAsyncError("PhotoUploader.handleUploadNext:sync", () =>
      syncPhoto(photoId)
    );
    await idleness();

    this.uploadNext();
  }

  private pendingPhotoIds(): Promise<string[]> {
    return this.queue.list();
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
