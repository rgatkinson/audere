// Copyright (c) 2018, 2019 by Audere
//
// Use of this source code is governed by an MIT-style license that
// can be found in the LICENSE file distributed with this file.

import _ from "lodash";

import { Inst } from "../../src/util/sql";

export interface Updater<TAttr, TInfo, TDevice> {
  cleanupForTesting(...csruids: string[]): Promise<void>;
  setDemo(current: Inst<TAttr>, isDemo: boolean): Promise<boolean>;
  load(key: string): Promise<Inst<TAttr>>;
  loadBackup(rowId: string): Promise<Inst<TAttr>>;
  loadBackups(csruid: string): Promise<Inst<TAttr>[]>;
  updateItem(current: Inst<TAttr>, update: TInfo): Promise<boolean>;
  updateDevice(current: Inst<TAttr>, update: TDevice): Promise<boolean>;
  update(current: Inst<TAttr>, update: TAttr): Promise<boolean>;
}
