// Copyright (c) 2018 by Audere
//
// Use of this source code is governed by an MIT-style license that
// can be found in the LICENSE file distributed with this file.

import { EventInfo, EventInfoKind } from "audere-lib/coughProtocol";

export interface EventTracker {
  fireNow(kind: EventInfoKind, refId?: string): void;
  fire(event: EventInfo): void;
}
