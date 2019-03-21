// Copyright (c) 2018 by Audere
//
// Use of this source code is governed by an MIT-style license that
// can be found in the LICENSE file distributed with this file.

import { deepEqual, instance, mock, when, verify } from "ts-mockito";
import { Incentives } from "../../src/services/fever/incentiveRecipients";
import { IncentiveRecipientsDataAccess } from "../../src/services/fever/incentiveRecipientsData";
import { makeBatchData } from "./reportTestUtil";
import { SurveyCompleteItem } from "../../src/services/fever/surveyCompleteData";
import { Batch } from "../../src/services/fever/surveyBatchData";

describe("incentive recipients", () => {
  const [batch, piiData] = makeBatchData(2);
  const incentiveBatch = <Batch<SurveyCompleteItem>>batch;
  incentiveBatch.items[0].csruid = "csruid0";
  incentiveBatch.items[0].boxBarcode = "aaa";
  incentiveBatch.items[0].dateReceived = "2019-01-01";
  incentiveBatch.items[1].csruid = "csruid1";
  incentiveBatch.items[1].boxBarcode = "bbb";
  incentiveBatch.items[1].dateReceived = "2019-02-02";

  it("should replay an existing batch if it wasn't completed", async () => {
    const dao = mock(IncentiveRecipientsDataAccess);
    when(dao.getExistingBatch()).thenResolve(batch);
    when(dao.getExistingItems(batch.items)).thenResolve(incentiveBatch.items);
    when(dao.getPiiData(deepEqual(["csruid0", "csruid1"]))).thenResolve(
      piiData
    );

    const i = new Incentives(instance(dao), undefined);
    const result = await i.getBatch();

    expect(result.id).toBe(batch.id);
    expect(result.items).toHaveLength(2);
  });

  it("should fetch and track a new batch if there are no batches pending", async () => {
    const dao = mock(IncentiveRecipientsDataAccess);
    when(dao.getExistingBatch()).thenResolve(null);
    when(dao.getNewItems()).thenResolve(incentiveBatch.items);
    when(dao.getPiiData(deepEqual(["csruid0", "csruid1"]))).thenResolve(
      piiData
    );
    when(dao.trackBatch(incentiveBatch.items)).thenResolve(incentiveBatch);

    const i = new Incentives(instance(dao), undefined);
    await i.getBatch();

    verify(dao.trackBatch(incentiveBatch.items)).called();
  });
});
