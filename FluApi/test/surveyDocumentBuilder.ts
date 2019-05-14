// Copyright (c) 2018 by Audere
//
// Use of this source code is governed by an MIT-style license that
// can be found in the LICENSE file distributed with this file.

import {
  SampleInfo,
  SurveyDocument,
  TelecomInfoSystem
} from "audere-lib/feverProtocol";
import { surveyPost } from "./endpoints/feverSampleData";
import _ from "lodash";

export class SurveyDocumentBuilder {
  private surveyDocument: SurveyDocument;

  constructor(csruid: string) {
    this.surveyDocument = _.cloneDeep(surveyPost(csruid));
    this.surveyDocument.survey.samples.forEach(
      s => (s.sample_type = "manualEntry")
    );
    this.surveyDocument.survey.responses = [
      {
        id: "Questionnaire",
        item: [
          {
            id: "CakeVeracity",
            text: "Is the cake a lie?",
            answer: [{ valueString: "true" }]
          },
          {
            id: "BirthDate",
            text: "What is your birth date?",
            answer: [{ valueString: "1900-01-01" }]
          }
        ]
      }
    ];
  }

  withDemoMode(): SurveyDocumentBuilder {
    this.surveyDocument.survey.isDemo = true;
    return this;
  }

  withEmail(email): SurveyDocumentBuilder {
    this.surveyDocument.survey.patient.telecom = [
      {
        system: TelecomInfoSystem.Email,
        value: email
      }
    ];
    return this;
  }

  withSamples(samples: SampleInfo[]): SurveyDocumentBuilder {
    this.surveyDocument.survey.samples = samples;
    return this;
  }

  build(): SurveyDocument {
    return this.surveyDocument;
  }
}
