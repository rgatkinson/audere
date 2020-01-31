// Copyright (c) 2019 by Audere
//
// Use of this source code is governed by an MIT-style license that
// can be found in the LICENSE file distributed with this file.

import { Platform, NativeModules } from "react-native";

export interface UploadQueue {
  add(uid: string, path: string, removeOriginal: boolean): Promise<void>;
  deleteFile(path: string): Promise<void>;
  list(): Promise<string[]>;
  upload(uid: string): Promise<void>;
}

export function createUploadQueue(prefix: string): UploadQueue {
  return new NativeUploadQueue(prefix);
}

class NativeUploadQueue {
  private readonly prefix: string;

  constructor(prefix: string) {
    this.prefix = prefix;
  }

  public async add(
    uid: string,
    path: string,
    removeOriginal: boolean
  ): Promise<void> {
    return NativeModules.FirebaseStorageUploadModule.add(
      this.prefix,
      uid,
      path,
      removeOriginal
    );
  }

  public async deleteFile(path: string): Promise<void> {
    return NativeModules.FirebaseStorageUploadModule.deleteFile(path);
  }

  public async list(): Promise<string[]> {
    return NativeModules.FirebaseStorageUploadModule.list(this.prefix);
  }

  public async upload(uid: string): Promise<void> {
    return NativeModules.FirebaseStorageUploadModule.upload(this.prefix, uid);
  }
}
