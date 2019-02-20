// Copyright (c) 2018 by Audere
//
// Use of this source code is governed by an MIT-style license that
// can be found in the LICENSE file distributed with this file.

import { EventInfo } from "audere-lib/feverProtocol";

export interface EventTracker {
  fire(event: EventInfo): void;
}
