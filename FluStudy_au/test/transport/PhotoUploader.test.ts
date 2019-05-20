// Copyright (c) 2019 by Audere
//
// Use of this source code is governed by an MIT-style license that
// can be found in the LICENSE file distributed with this file.

import {
  pendingPathFromId,
  PhotoUploader, RETRY_DELAY,
} from "../../src/transport/PhotoUploader";
import { FileSystem } from "expo";
import base64url from "base64url";

interface CapturedSave {
  fileContents: string;
  filePath: string;
  storagePath: string;
}

jest.useFakeTimers();

describe("PhotoUploader", () => {
  describe("save", () => {
    let onlineSaves: CapturedSave[];
    let offlineSaves: CapturedSave[];
    let online = true;

    let putFile = jest.fn(async ({filePath, storagePath}) => {
      const fileContents = await FileSystem.readAsStringAsync(filePath);
      const save: CapturedSave = { fileContents, filePath, storagePath };
      if (online) {
        onlineSaves.push(save);
      } else {
        offlineSaves.push(save);
        throw new Error("Mock putFile: not online, failing");
      }
    });
    let uploader = new PhotoUploader({ storage: { putFile } });

    beforeEach(() => {
      onlineSaves = [];
      offlineSaves = [];
    });

    it("uploads a photo", async () => {
      const photoId = "photo";
      const jpegBase64 = base64url(photoId);

      uploader.savePhoto(photoId, jpegBase64);
      await uploader.waitForIdleInTest();
      expect(onlineSaves).toEqual([ capture(photoId, jpegBase64) ]);
      expect(offlineSaves).toEqual([]);
    });

    it("uploads multiple photos", async () => {
      const photo0Id = "photo0";
      const jpeg0Base64 = base64url(photo0Id);
      const photo1Id = "photo1";
      const jpeg1Base64 = base64url(photo1Id);

      uploader.savePhoto(photo0Id, jpeg0Base64);
      uploader.savePhoto(photo1Id, jpeg1Base64);

      await uploader.waitForIdleInTest();
      expect(onlineSaves).toEqual([
        capture(photo0Id, jpeg0Base64),
        capture(photo1Id, jpeg1Base64)
      ]);
      expect(offlineSaves).toEqual([]);
    });

    it("retries if putFile fails", async () => {
      const photoId = "photo";
      const jpegBase64 = base64url(photoId);

      online = false;
      uploader.savePhoto(photoId, jpegBase64);
      await uploader.waitForIdleInTest();
      expect(onlineSaves).toEqual([]);
      expect(offlineSaves).toEqual([ capture(photoId, jpegBase64) ]);
      offlineSaves = [];

      jest.runTimersToTime(RETRY_DELAY - 1);
      await uploader.waitForIdleInTest();
      expect(onlineSaves).toEqual([]);
      expect(offlineSaves).toEqual([]);

      online = true;
      jest.runTimersToTime(2);
      await uploader.waitForIdleInTest();
      expect(onlineSaves).toEqual([ capture(photoId, jpegBase64) ]);
      expect(offlineSaves).toEqual([]);
    });

    function capture(photoId: string, fileContents: string): CapturedSave {
      return {
        fileContents,
        filePath: pendingPathFromId(photoId),
        storagePath: uploader.storagePathFromId(photoId)
      };
    }
  });
});
