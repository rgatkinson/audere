// Copyright (c) 2018 by Audere
//
// Use of this source code is governed by an MIT-style license that
// can be found in the LICENSE file distributed with this file.

import { DocumentType } from "audere-lib";
import { DeviceInfo } from "./DeviceInfo";

// Wrapper document saved in PouchDB.
export interface PouchDoc {
  // Local unique id, typically just a uuid.  This is the key in PouchDB
  _id: string;

  // Document to be sent on the wire.
  body: ProtocolDoc;
}

// Wrapper document sent on the wire.
export interface ProtocolDoc {
  // Cryptographically secure random identifier that we obtain from
  // the server before uploading.  Allows null so that we can save
  // the document locally in PouchDB before we obtain the csruid.
  csruid: string | null;

  // Whether document is a Visit, Feedback, or a Log
  documentType: DocumentType;

  // Local device info at the time of save.
  device: DeviceInfo;

  // Visit information saved from the user interface.
  document: UploadDoc;
}

// The transport module does not place restrictions on what we upload.
export type UploadDoc = any;
