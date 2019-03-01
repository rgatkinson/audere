// Copyright (c) 2018 by Audere
//
// Use of this source code is governed by an MIT-style license that
// can be found in the LICENSE file distributed with this file.

import { anything, deepEqual, instance, mock, when, verify } from "ts-mockito";
import { IncentiveRecipientsDataAccess, IncentiveRecipients } from "../../src/services/feverApi/incentiveRecipients";
import { surveyPIIInDb } from "../endpoints/feverSampleData";
import { TelecomInfoSystem, AddressInfoUse, PIIInfo } from "audere-lib/feverProtocol";
import { SurveyAttributes } from "../../src/models/fever";
import { Batch, BatchItem } from "../../src/services/feverApi/surveyBatchData";

describe("incentive recipients", () => {
  function createTestData(
    num: number
  ): [Batch<BatchItem>, SurveyAttributes<PIIInfo>[]] {
    const items = [];
    const surveys = [];

    for (let i = 0; i < num; i++) {
      items.push({
        workflowId: i,
        surveyId: i,
        csruid: "csruid" + i
      });
      surveys.push(createPiiData(i));
    }

    const batch = { id: Math.random(), items: items };
    return [batch, surveys];
  }

  function createPiiData(id: number): SurveyAttributes<PIIInfo> {
    const data = surveyPIIInDb("csruid" + id);

    data.survey.patient.telecom.push({ 
      system: TelecomInfoSystem.Email,
      value: "email" + id + "@email.com"
    });

    data.survey.patient.address.push({
      use: AddressInfoUse.Home,
      firstName: "first",
      lastName: "last",
      line: [id + " Main St."],
      city: "Schenectady",
      state: "NY",
      postalCode: "12345",
      country: "US"
    });

    return data;
  }

  it("should replay an existing batch if it wasn't completed", async () => {
    const [batch, piiData] = createTestData(2);

    const dao = mock(IncentiveRecipientsDataAccess);
    when(dao.getExistingBatch()).thenResolve(batch);
    when(dao.getPiiData(deepEqual(["csruid0", "csruid1"])))
      .thenResolve(piiData);

    const ir = new IncentiveRecipients(instance(dao));
    const result = await ir.getBatch();

    expect(result.id).toBe(batch.id);
    expect(result.items).toHaveLength(2);
  });

  it("should fetch and track a new batch if there are no batches pending", async () => {
    const [batch, piiData] = createTestData(2);

    const dao = mock(IncentiveRecipientsDataAccess);
    when(dao.getExistingBatch()).thenResolve(null);
    when(dao.getNewBatchItems()).thenResolve(batch.items);
    when(dao.getPiiData(deepEqual(["csruid0", "csruid1"])))
      .thenResolve(piiData);
    when(dao.trackBatch(anything())).thenResolve(batch);

    const ir = new IncentiveRecipients(instance(dao));
    const result = await ir.getBatch();

    verify(dao.trackBatch(anything())).called();
  });
});