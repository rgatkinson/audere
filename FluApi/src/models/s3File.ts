// Copyright (c) 2019 by Audere
//
// Use of this source code is governed by an MIT-style license that
// can be found in the LICENSE file distributed with this file.

export interface S3File {
  key: string;
  hash: string;
}

export interface S3Records<T> {
  file: S3File;
  records: T[];
}
