// Copyright (c) 2019 by Audere
//
// Use of this source code is governed by an MIT-style license that
// can be found in the LICENSE file distributed with this file.

import * as XLSX from "xlsx";
import AWS from "aws-sdk";
import parse from "csv-parse/lib/sync";
import { instance, mock, when } from "ts-mockito";
import { ObjectList } from "aws-sdk/clients/s3";

export function getExcelS3Client(list: ObjectList, sheet: string): AWS.S3 {
  const s3 = new AWS.S3({ region: "us-west-2" });

  const listRequest = mock(AWS.Request);
  when(listRequest.promise()).thenResolve({
    Contents: list,
    $response: null,
  });
  s3.listObjectsV2 = params => {
    return instance(listRequest);
  };

  const getRequest = mock(AWS.Request);
  const wb = XLSX.utils.book_new();
  const csv = parse(sheet);
  const ws = XLSX.utils.aoa_to_sheet(csv);
  XLSX.utils.book_append_sheet(wb, ws, "Data");
  const outputBuffer = XLSX.write(wb, { type: "buffer" });

  when(getRequest.promise()).thenResolve({
    Body: outputBuffer,
    $response: null,
  });
  s3.getObject = params => {
    return instance(getRequest);
  };

  return s3;
}
