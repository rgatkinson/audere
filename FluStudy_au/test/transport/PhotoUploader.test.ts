// Copyright (c) 2019 by Audere
//
// Use of this source code is governed by an MIT-style license that
// can be found in the LICENSE file distributed with this file.

import {
  NetInfoIsConnected,
  NetInfoIsConnectedListener,
  pendingPathFromId,
  PhotoUploader,
  RETRY_DELAY,
} from "../../src/transport/PhotoUploader";
import * as FileSystem from "expo-file-system";
import base64url from "base64url";

interface CapturedSave {
  fileContents: string;
  filePath: string;
  storagePath: string;
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

describe("PhotoUploader", () => {
  describe("save", () => {
    let saves: CapturedSave[];
    let offlineSaves: CapturedSave[];
    let corruptSaves: CapturedSave[];
    let network = new FakeNetwork();

    let putFile = jest.fn(async ({ filePath, storagePath }) => {
      const fileContents = await FileSystem.readAsStringAsync(filePath);
      const save: CapturedSave = { fileContents, filePath, storagePath };
      if (fileContents.indexOf("corrupt") >= 0) {
        corruptSaves.push(save);
        throw new Error("Mock putFile: corrupted save");
      }
      if (network.online()) {
        saves.push(save);
      } else {
        offlineSaves.push(save);
        throw new Error("Mock putFile: not online, failing");
      }
    });
    let uploader = new PhotoUploader({ storage: { putFile }, network });

    beforeEach(() => {
      saves = [];
      offlineSaves = [];
      corruptSaves = [];
    });

    it("uploads a photo", async () => {
      const photoId = "photo";
      const jpegBase64 = base64url(photoId);

      uploader.savePhoto(photoId, jpegBase64);
      await uploader.waitForIdle();
      expect(saves).toEqual([capture(photoId, jpegBase64)]);
      expect(offlineSaves).toEqual([]);
    });

    it("uploads multiple photos", async () => {
      const photo0Id = "photo0";
      const jpeg0Base64 = base64url(photo0Id);
      const photo1Id = "photo1";
      const jpeg1Base64 = base64url(photo1Id);

      uploader.savePhoto(photo0Id, jpeg0Base64);
      uploader.savePhoto(photo1Id, jpeg1Base64);

      await uploader.waitForIdle();
      expect(saves).toEqual([
        capture(photo0Id, jpeg0Base64),
        capture(photo1Id, jpeg1Base64),
      ]);
      expect(offlineSaves).toEqual([]);
    });

    it("retries if putFile fails", async () => {
      const photoId = "photo";
      const jpegBase64 = base64url(photoId);

      network.setOnline(false);
      uploader.savePhoto(photoId, jpegBase64);
      await uploader.waitForIdle();
      expect(saves).toEqual([]);

      jest.runTimersToTime(RETRY_DELAY - 1);
      await uploader.waitForIdle();
      expect(saves).toEqual([]);

      network.setOnline(true);
      jest.runTimersToTime(2);
      await uploader.waitForIdle();
      expect(saves).toEqual([capture(photoId, jpegBase64)]);

      expect(offlineSaves).toEqual([]);
    });

    it("doesn't get stuck on corrupt file", async () => {
      const photo0Id = "photo0";
      const jpeg0Base64 = base64url(photo0Id);
      const photo1Id = "photo1";
      const jpeg1Base64 = "corrupt image that fails upload";
      const photo2Id = "photo2";
      const jpeg2Base64 = base64url(photo2Id);

      uploader.savePhoto(photo0Id, jpeg0Base64);
      uploader.savePhoto(photo1Id, jpeg1Base64);
      uploader.savePhoto(photo2Id, jpeg2Base64);

      await uploader.waitForIdle();
      expect(saves).toEqual([
        capture(photo0Id, jpeg0Base64),
        capture(photo2Id, jpeg2Base64),
      ]);
    });

    function capture(photoId: string, fileContents: string): CapturedSave {
      return {
        fileContents,
        filePath: pendingPathFromId(photoId),
        storagePath: uploader.storagePathFromId(photoId),
      };
    }
  });
});
