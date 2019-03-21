// Copyright (c) 2018 by Audere
//
// Use of this source code is governed by an MIT-style license that
// can be found in the LICENSE file distributed with this file.

import { deepEqual, instance, mock, when, verify } from "ts-mockito";
import { makeBatchData } from "./reportTestUtil";
import { FollowUpDataAccess } from "../../src/services/fever/followUpData";
import { FollowUpSurveys } from "../../src/services/fever/followUpSurveys";
import { SurveyCompleteItem } from "../../src/services/fever/surveyCompleteData";
import { Batch } from "../../src/services/fever/surveyBatchData";

describe("incentive recipients", () => {
  const [batch, piiData] = makeBatchData(2);
  const surveyBatch = <Batch<SurveyCompleteItem>>batch;
  surveyBatch.items[0].csruid = "csruid0";
  surveyBatch.items[0].boxBarcode = "aaa";
  surveyBatch.items[0].dateReceived = "2019-01-01";
  surveyBatch.items[1].csruid = "csruid1";
  surveyBatch.items[1].boxBarcode = "bbb";
  surveyBatch.items[1].dateReceived = "2019-02-02";

  it("should replay an existing batch if it wasn't completed", async () => {
    const dao = mock(FollowUpDataAccess);
    when(dao.getExistingBatch()).thenResolve(batch);
    when(dao.getExistingItems(batch.items)).thenResolve(surveyBatch.items);
    when(dao.getPiiData(deepEqual(["csruid0", "csruid1"]))).thenResolve(
      piiData
    );

    const i = new FollowUpSurveys(instance(dao), undefined);
    const result = await i.getBatch();

    expect(result.id).toBe(batch.id);
    expect(result.items).toHaveLength(2);
  });

  it("should fetch and track a new batch if there are no batches pending", async () => {
    const dao = mock(FollowUpDataAccess);
    when(dao.getExistingBatch()).thenResolve(null);
    when(dao.getNewItems()).thenResolve(surveyBatch.items);
    when(dao.getPiiData(deepEqual(["csruid0", "csruid1"]))).thenResolve(
      piiData
    );
    when(dao.trackBatch(surveyBatch.items)).thenResolve(surveyBatch);

    const i = new FollowUpSurveys(instance(dao), undefined);
    await i.getBatch();

    verify(dao.trackBatch(surveyBatch.items)).called();
  });
});
