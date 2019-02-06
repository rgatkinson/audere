// Copyright (c) 2018 by Audere
//
// Use of this source code is governed by an MIT-style license that
// can be found in the LICENSE file distributed with this file.

import { DocumentType, ProtocolDocument } from "audere-lib/feverProtocol";
import { DeviceInfo } from "./DeviceInfo";

// Wrapper document saved in PouchDB.
export interface PouchDoc {
  // Local unique id, typically just a uuid.  This is the key in PouchDB
  _id: string;

  // Document to be sent on the wire.
  body: ProtocolDocument;
}
