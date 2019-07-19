// Copyright (c) 2018 by Audere
//
// Use of this source code is governed by an MIT-style license that
// can be found in the LICENSE file distributed with this file.

import { ProtocolDocument } from "audere-lib/snifflesProtocol";

// Wrapper document saved in PouchDB.
export interface PouchDoc {
  // Local unique id, typically just a uuid.  This is the key in PouchDB
  _id: string;

  // Revision, per PouchDB
  _rev?: string;

  // Document to be sent on the wire.
  body: ProtocolDocument;
}
