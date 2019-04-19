// Copyright (c) 2018 by Audere
//
// Use of this source code is governed by an MIT-style license that
// can be found in the LICENSE file distributed with this file.

export interface KitRecord {
  recordId?: number;
  dateReceived?: string;
  boxBarcode: string;
  utmBarcode?: string;
  rdtBarcode?: string;
  stripBarcode?: string;
}
