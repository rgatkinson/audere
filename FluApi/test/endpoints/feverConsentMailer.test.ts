// Copyright (c) 2019 by Audere
//
// Use of this source code is governed by an MIT-style license that
// can be found in the LICENSE file distributed with this file.

import _ from "lodash";
import { Op } from "sequelize";
import request from "supertest";
import { anything, instance, mock, when } from "ts-mockito";
import { SendMailOptions } from "nodemailer";

import { Emailer } from "../../src/util/email";
import { createPublicApp, createInternalApp } from "../../src/app";
import { createSplitSql } from "../../src/util/sql";
import { defineFeverModels, FeverModels } from "../../src/models/fever";
import { surveyPost, makeCSRUID } from "./feverSampleData";
import {
  FeverConsentEmailerEndpoint,
  newSurveys
} from "../../src/endpoints/feverConsentMailer";
import { SurveyDocument } from "audere-lib/feverProtocol";
import { createTestSessionStore } from "../../src/endpoints/webPortal/endpoint";

describe("FeverConsentEmailer", () => {
  let sql;
  let sessionStore;
  let internalApp;
  let publicApp;
  let models: FeverModels;
  let accessKey;
  let emails: SendMailOptions[];

  beforeAll(async done => {
    sql = createSplitSql();
    models = defineFeverModels(sql);
    accessKey = await models.accessKey.create({
      key: "accesskey1",
      valid: true
    });
    sessionStore = createTestSessionStore(sql);
    publicApp = await createPublicApp({ sql, sessionStore });
    done();
  });

  afterAll(async done => {
    await accessKey.destroy();
    await sql.close();
    done();
  });

  beforeEach(() => {
    emails = [];
    const MockEmailer = mock(Emailer);
    when(MockEmailer.send(anything())).thenCall(async email =>
      emails.push(email)
    );
    internalApp = createInternalApp({
      sql,
      sessionStore,
      consentEmailer: new FeverConsentEmailerEndpoint(
        sql,
        instance(MockEmailer)
      )
    });
  });

  it("emails consent if requested", async () => {
    const csruid = makeCSRUID("emails consent if requested");
    const post = _.cloneDeep(surveyPost(csruid));

    postRequestConsentEmail(post, true);
    postMarkScreeningComplete(post, true);

    const result = await putSurveyAndRunEmailer(post);

    // We should have completed 1 item and sent email for it.
    expect(result.body.length).toBeGreaterThan(0);
    expect(emails.length).toEqual(1);

    await deleteSurvey(csruid);
  });

  it("does not email consent if request not mentioned", async () => {
    const csruid = makeCSRUID(
      "does not email consent if request not mentioned"
    );
    const post = _.cloneDeep(surveyPost(csruid));

    postMarkScreeningComplete(post, true);

    const result = await putSurveyAndRunEmailer(post);

    // We should have completed 1 item and avoided sending email for it.
    expect(result.body.length).toEqual(1);
    expect(emails.length).toEqual(0);

    await deleteSurvey(csruid);
  });

  it("does not email consent if requested not to", async () => {
    const csruid = makeCSRUID("does not email consent if requested not to");
    const post = _.cloneDeep(surveyPost(csruid));

    postRequestConsentEmail(post, false);
    postMarkScreeningComplete(post, true);

    const result = await putSurveyAndRunEmailer(post);

    // We should have completed 1 item and avoided sending email for it.
    expect(result.body.length).toEqual(1);
    expect(emails.length).toEqual(0);

    await deleteSurvey(csruid);
  });

  it("does nothing if no consent", async () => {
    const csruid = makeCSRUID("does nothing if no consent");
    const post = _.cloneDeep(surveyPost(csruid));

    postRequestConsentEmail(post, true);
    postMarkScreeningComplete(post, true);
    post.survey.consents.splice(0);

    const result = await putSurveyAndRunEmailer(post);

    // We should not have completed any items, nor sent any email.
    expect(result.body.length).toEqual(0);
    expect(emails.length).toEqual(0);

    await deleteSurvey(csruid);
  });

  it("does nothing if no email", async () => {
    const csruid = makeCSRUID("does nothing if no email");
    const post = _.cloneDeep(surveyPost(csruid));

    postRequestConsentEmail(post, true);
    postMarkScreeningComplete(post, true);
    post.survey.patient.telecom.splice(0);

    const result = await putSurveyAndRunEmailer(post);

    // We should not have completed any items, nor sent any email.
    expect(result.body.length).toEqual(0);
    expect(emails.length).toEqual(0);

    await deleteSurvey(csruid);
  });

  it("does not email consent if screening not complete", async () => {
    const csruid = makeCSRUID(
      "does not email consent if screening not complete"
    );
    const post = _.cloneDeep(surveyPost(csruid));

    postRequestConsentEmail(post, true);
    postMarkScreeningComplete(post, false);

    const result = await putSurveyAndRunEmailer(post);

    // We should not have completed any items, nor sent any email.
    expect(result.body.length).toEqual(0);
    expect(emails.length).toEqual(0);

    await deleteSurvey(csruid);
  });

  it("does not email consent more than once", async () => {
    const csruid = makeCSRUID("does not email consent more than once");
    const post = _.cloneDeep(surveyPost(csruid));

    postRequestConsentEmail(post, true);
    postMarkScreeningComplete(post, true);

    await putSurveyAndRunEmailer(post);
    emails.splice(0);

    const result = await runEmailer();

    // Second time around we should not have completed any items, nor sent any email.
    expect(result.body.length).toEqual(0);
    expect(emails.length).toEqual(0);

    await deleteSurvey(csruid);
  });

  it("does not email consent if demo mode", async () => {
    const csruid = makeCSRUID("does not email consent if demo mode");
    const post = _.cloneDeep(surveyPost(csruid));

    postRequestConsentEmail(post, true);
    postMarkScreeningComplete(post, true);
    post.survey.isDemo = true;

    const result = await putSurveyAndRunEmailer(post);

    // We should have completed 1 item and sent email for it.
    expect(result.body.length).toEqual(0);
    expect(emails.length).toEqual(0);

    await deleteSurvey(csruid);
  });

  async function putSurveyAndRunEmailer(document: SurveyDocument) {
    // Clean up beforehand in case a previous test failed and left behind.
    // An existing record can cause these tests to fail.
    await deleteSurvey(document.csruid);

    await request(publicApp)
      .put(`/api/fever/documents/${accessKey.key}/${document.csruid}`)
      .send(document)
      .set("Content-Type", "application/json")
      .expect(200);

    return await runEmailer();
  }

  async function runEmailer() {
    const result = await request(internalApp)
      .get("/api/sendConsentEmails")
      .expect(200);

    // There should never be any pending surveys after we process.
    const afterProcessing = await newSurveys(models);
    expect(afterProcessing.length).toEqual(0);

    return result;
  }

  function postMarkScreeningComplete(post: SurveyDocument, value: boolean) {
    post.survey.workflow.screeningCompletedAt = value
      ? new Date(2019, 1, 2).toISOString()
      : undefined;
  }

  function postRequestConsentEmail(post: SurveyDocument, value: boolean) {
    post.survey.responses[0].item.push({
      id: "Consent",
      text: "Do you want a copy of this consent emailed to you?",
      answer: [{ valueBoolean: value }]
    });
  }

  async function deleteSurvey(csruid: string): Promise<void> {
    const piiSurvey = await models.surveyPii.findOne({
      where: { csruid }
    });
    if (piiSurvey != null) {
      await models.consentEmail.destroy({
        where: {
          survey_id: { [Op.eq]: piiSurvey.id }
        }
      });
      await piiSurvey.destroy();
    }
    const nonPiiSurvey = await models.surveyNonPii.findOne({
      where: { csruid }
    });
    if (nonPiiSurvey != null) {
      await nonPiiSurvey.destroy();
    }
  }
});
