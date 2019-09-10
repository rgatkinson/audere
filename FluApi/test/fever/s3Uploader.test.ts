// Copyright (c) 2018 by Audere
//
// Use of this source code is governed by an MIT-style license that
// can be found in the LICENSE file distributed with this file.

import * as AWS from "aws-sdk";
import { S3Config } from "../../src/util/s3Config";
import { mock, when, instance } from "ts-mockito";
import { S3Uploader } from "../../src/external/s3Uploader";

describe("S3 uploader", () => {
  type PutRequest = AWS.Request<AWS.S3.Types.PutObjectOutput, AWS.AWSError>;
  const s3Config: S3Config = {
    fluReportsBucket: "test_bucket",
    asprenReportsBucket: "not_test_bucket",
    coughFollowUpBucket: "bucket_in_space",
    fileshareBucket: "fileshare_bucket",
  };

  it("should upload incentive reports", async () => {
    let requestParams: AWS.S3.Types.PutObjectRequest;
    const request: PutRequest = mock(AWS.Request);
    when(request.promise()).thenReturn(Promise.resolve(undefined));

    // The AWS SDK late-binds functions so we modify the object instead of using
    // a mock.
    const s3 = new AWS.S3();
    s3.putObject = params => {
      requestParams = params;
      return instance(request);
    };

    const contents = "A borrowed book is like a guest in the house";
    const uploader = new S3Uploader(s3, s3Config);
    await uploader.sendIncentives(5, contents);

    expect(requestParams.Bucket).toBe(s3Config.fluReportsBucket);
    expect(requestParams.Key).toMatch(
      /gift-card-reports\/FluHome_GiftCardToSend_5/
    );
    expect(requestParams.Body).toBe(contents);
  });

  it("should upload kit reports", async () => {
    let requestParams: AWS.S3.Types.PutObjectRequest;
    const request: PutRequest = mock(AWS.Request);
    when(request.promise()).thenReturn(Promise.resolve(undefined));

    // The AWS SDK late-binds functions so we modify the object instead of using
    // a mock.
    const s3 = new AWS.S3();
    s3.putObject = params => {
      requestParams = params;
      return instance(request);
    };

    const contents =
      "There are in the body politic, economic and social, " +
      "many and grave evils";
    const uploader = new S3Uploader(s3, s3Config);
    await uploader.sendKits(2, contents);

    expect(requestParams.Bucket).toBe(s3Config.fluReportsBucket);
    expect(requestParams.Key).toMatch(
      /fulfillment-order-reports\/Kit\-Fulfillment\-Report\-2/
    );
    expect(requestParams.Body).toBe(contents);
  });
});
