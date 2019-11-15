// Copyright (c) 2019 by Audere
//
// Use of this source code is governed by an MIT-style license that
// can be found in the LICENSE file distributed with this file.

import {
  NetInfoIsConnected,
  NetInfoIsConnectedListener,
  PhotoUploader,
  RETRY_DELAY,
} from "../../src/transport/PhotoUploader";
import base64url from "base64url";
import { UploadQueue } from "../../src/transport/FirebaseUploadHelper";

type QueueEvent = QueueAddEvent | QueueUploadEvent;

interface QueueAddEvent {
  type: "add";
  uid: string;
  filepath: string;
}
function addSuccess(uid: string, filepath: string): QueueAddEvent {
  return { type: "add", uid, filepath };
}

interface QueueUploadEvent {
  type: "upload";
  uid: string;
  result: boolean;
}
function uploadSuccess(uid: string): QueueUploadEvent {
  return { type: "upload", uid, result: true };
}
function uploadFailure(uid: string): QueueUploadEvent {
  return { type: "upload", uid, result: false };
}

jest.useFakeTimers();

class FakeNetwork implements NetInfoIsConnected {
  private isOnline: boolean = true;
  private readonly listeners: NetInfoIsConnectedListener[] = [];

  addEventListener(
    eventName: string,
    listener: NetInfoIsConnectedListener
  ): void {
    if (eventName != "connectionChange") {
      throw new Error(`Expected 'connectionChange', got '${eventName}'`);
    }
    this.listeners.push(listener);
  }

  async fetch(): Promise<boolean> {
    return this.isOnline;
  }

  online(): boolean {
    return this.isOnline;
  }

  setOnline(value: boolean): void {
    this.isOnline = value;
    this.listeners.forEach(listener => listener(value));
  }
}

class FakeQueue implements UploadQueue {
  private pending: string[] = [];
  private fails: string[] = [];
  private failAll = false;
  private lastAssert: Error | null = null;

  private log: QueueEvent[] = [];

  resetAfterTest() {
    if (this.lastAssert != null) {
      throw this.lastAssert;
    }

    this.pending = [];
    this.fails = [];
    this.log = [];
    this.failAll = false;
    this.lastAssert = null;
  }

  getAndClearLog() {
    const log = this.log;
    this.log = [];
    return log;
  }

  getPending() {
    return [...this.pending];
  }

  setFailAll(value: boolean) {
    this.failAll = value;
  }

  setFailUid(uid: string, value: boolean) {
    const index = this.fails.indexOf(uid);
    if (value && index < 0) {
      this.fails.push(uid);
    } else if (!value && index >= 0) {
      this.fails.splice(index, 1);
    }
  }

  async add(uid: string, filepath: string): Promise<void> {
    const index = this.pending.indexOf(uid);
    if (index > 0) {
      this.lastAssert = Error(`Unexpected duplicate add uid: '${uid}'`);
    }
    this.pending.push(uid);
    this.log.push(addSuccess(uid, filepath));
  }

  async list(): Promise<string[]> {
    return [...this.pending];
  }

  async upload(uid: string): Promise<void> {
    const index = this.pending.indexOf(uid);
    if (index < 0) {
      this.lastAssert = Error(`Unexpected upload uid: '${uid}'`);
    }
    if (this.failAll || this.fails.indexOf(uid) >= 0) {
      this.log.push(uploadFailure(uid));
      throw new Error(`simulating upload failure for ${uid}`);
    } else {
      this.pending.splice(index, 1);
      this.log.push(uploadSuccess(uid));
    }
  }
}

describe("PhotoUploader", () => {
  describe("save", () => {
    let network = new FakeNetwork();
    let queue = new FakeQueue();

    let uploader = new PhotoUploader({ network, queue });

    afterEach(() => queue.resetAfterTest());

    it("uploads a photo", async () => {
      const photoId = "photo";
      const photoPath = "file:///sdcard/photo.jpeg";

      uploader.enqueueFileContents(photoId, photoPath);
      await uploader.waitForIdle();
      expect(queue.getPending()).toEqual([]);
      expect(queue.getAndClearLog()).toEqual([
        addSuccess(photoId, photoPath),
        uploadSuccess(photoId),
      ]);
    });

    it("uploads multiple photos", async () => {
      const photo0Id = "photo0";
      const photo0Path = "file:///sdcard/photo0.jpeg";
      const photo1Id = "photo1";
      const photo1Path = "file:///sdcard/photo1.jpeg";

      uploader.enqueueFileContents(photo0Id, photo0Path);
      uploader.enqueueFileContents(photo1Id, photo1Path);

      await uploader.waitForIdle();
      expect(queue.getPending()).toEqual([]);
      expect(queue.getAndClearLog()).toEqual([
        addSuccess(photo0Id, photo0Path),
        addSuccess(photo1Id, photo1Path),
        uploadSuccess(photo0Id),
        uploadSuccess(photo1Id),
      ]);
    });

    it("retries if putFile fails, regardless of network state", async () => {
      const photoId = "photo";
      const photoPath = "file:///sdcard/photo.jpeg";

      queue.setFailAll(true);
      uploader.enqueueFileContents(photoId, photoPath);
      await uploader.waitForIdle();
      expect(queue.getPending()).toEqual([photoId]);
      expect(queue.getAndClearLog()).toEqual([
        addSuccess(photoId, photoPath),
        uploadFailure(photoId),
      ]);

      jest.runTimersToTime(RETRY_DELAY - 1);
      await uploader.waitForIdle();
      expect(queue.getAndClearLog()).toEqual([]);

      queue.setFailAll(false);

      jest.runTimersToTime(2);
      await uploader.waitForIdle();
      expect(queue.getPending()).toEqual([]);
      expect(queue.getAndClearLog()).toEqual([uploadSuccess(photoId)]);
    });

    it("retries immediately when going online", async () => {
      const photoId = "photo";
      const photoPath = "file:///sdcard/photo.jpeg";

      network.setOnline(false);
      uploader.enqueueFileContents(photoId, photoPath);
      await uploader.waitForIdle();
      expect(queue.getPending()).toEqual([photoId]);
      expect(queue.getAndClearLog()).toEqual([addSuccess(photoId, photoPath)]);

      jest.runTimersToTime(RETRY_DELAY / 2);
      await uploader.waitForIdle();
      expect(queue.getAndClearLog()).toEqual([]);

      network.setOnline(true);

      jest.runTimersToTime(2);
      await uploader.waitForIdle();
      expect(queue.getPending()).toEqual([]);
      expect(queue.getAndClearLog()).toEqual([uploadSuccess(photoId)]);
    });

    it("doesn't get stuck on corrupt file", async () => {
      const photo0Id = "photo0";
      const photo0Path = "file:///sdcard/photo0.jpeg";
      const photo1Id = "photo1";
      const photo1Path = "corrupt image that fails upload";
      const photo2Id = "photo2";
      const photo2Path = "file:///sdcard/photo2.jpeg";

      queue.setFailUid(photo1Id, true);

      uploader.enqueueFileContents(photo0Id, photo0Path);
      uploader.enqueueFileContents(photo1Id, photo1Path);
      uploader.enqueueFileContents(photo2Id, photo2Path);

      await uploader.waitForIdle();
      expect(queue.getPending()).toEqual([photo1Id]);
      // We end up enqueuing extra attempts to upload the failed item at the end.
      // They are not part of the required contract, but are harmless, so just
      // check the first 6.
      const log = queue.getAndClearLog();
      expect(log.splice(0, 6)).toEqual([
        addSuccess(photo0Id, photo0Path),
        addSuccess(photo1Id, photo1Path),
        addSuccess(photo2Id, photo2Path),
        uploadSuccess(photo0Id),
        uploadFailure(photo1Id),
        uploadSuccess(photo2Id),
      ]);
      // Expect any extras to be retries of the failure.
      log.forEach(item => expect(item).toEqual(uploadFailure(photo1Id)));
    });
  });
});
