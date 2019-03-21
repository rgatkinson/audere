// Copyright (c) 2019 by Audere
//
// Use of this source code is governed by an MIT-style license that
// can be found in the LICENSE file distributed with this file.

export interface UWUploader {
  sendIncentives(batch: number, contents: string): Promise<void>;
  sendKits(batch: number, contents: string): Promise<void>;
  sendFollowUps(batch: number, contents: string): Promise<void>;
  writeBarcodeErrors(contents: string): Promise<void>;
}
