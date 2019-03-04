// Copyright (c) 2018 by Audere
//
// Use of this source code is governed by an MIT-style license that
// can be found in the LICENSE file distributed with this file.

import { anything, deepEqual, instance, mock, when, verify } from "ts-mockito";
import { IncentiveRecipientsDataAccess, Incentives } from "../../src/services/feverApi/incentiveRecipients";
import { makeBatchData } from "./reportTestUtil";

describe("incentive recipients", () => {
  it("should replay an existing batch if it wasn't completed", async () => {
    const [batch, piiData] = makeBatchData(2);

    const dao = mock(IncentiveRecipientsDataAccess);
    when(dao.getExistingBatch()).thenResolve(batch);
    when(dao.getPiiData(deepEqual(["csruid0", "csruid1"])))
      .thenResolve(piiData);

    const i = new Incentives(instance(dao), undefined, undefined);
    const result = await i.getBatch();

    expect(result.id).toBe(batch.id);
    expect(result.items).toHaveLength(2);
  });

  it("should fetch and track a new batch if there are no batches pending", async () => {
    const [batch, piiData] = makeBatchData(2);

    const dao = mock(IncentiveRecipientsDataAccess);
    when(dao.getExistingBatch()).thenResolve(null);
    when(dao.getNewBatchItems()).thenResolve(batch.items);
    when(dao.getPiiData(deepEqual(["csruid0", "csruid1"])))
      .thenResolve(piiData);
    when(dao.trackBatch(anything())).thenResolve(batch);

    const i = new Incentives(instance(dao), undefined, undefined);
    await i.getBatch();

    verify(dao.trackBatch(anything())).called();
  });
});