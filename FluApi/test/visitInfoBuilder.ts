// Copyright (c) 2018 by Audere
//
// Use of this source code is governed by an MIT-style license that
// can be found in the LICENSE file distributed with this file.

import {
  AddressInfo,
  ConsentInfo,
  EventInfo,
  EventInfoKind,
  NonPIIConsentInfo,
  ResponseItemInfo,
  SampleInfo,
  VisitCommonInfo,
  VisitInfo
} from "audere-lib/snifflesProtocol";

export class VisitInfoBuilder {
  private consents = [];
  private patientInfo = {
    name: "Fake Name",
    birthDate: "1900-01-01",
    telecom: [],
    address: []
  };

  private readonly defaultSample = {
    sample_type: "SampleType",
    code: "Code"
  };

  private samples = [];

  private readonly nonpiiResponseItem = {
    id: "CakeVeracity",
    text: "Is the cake a lie?",
    answer: [{ valueString: "Yes" }]
  };

  private readonly piiResponseItem = {
    id: "BirthDate",
    text: "What is your birth date?",
    answer: [{ valueString: "1900-01-01" }]
  };

  private responses = [];

  private visitCommonInfo: VisitCommonInfo = {
    isDemo: false,
    complete: true,
    location: "Location Name",
    administrator: "Administrator Name",
    events: [
      {
        kind: EventInfoKind.Visit,
        at: "2019-01-01T00:00:00Z",
        until: "2019-01-01T01:00:00Z",
        refId: "CompletedQuestionnaire"
      }
    ]
  };

  private isDemo = false;

  withName(name: string) {
    this.patientInfo.name = name;
    return this;
  }

  withBirthDate(birthDate: string) {
    this.patientInfo.birthDate = birthDate;
    return this;
  }

  withAddress(address: AddressInfo) {
    this.patientInfo.address.push(address);
    return this;
  }

  withSamples(samples: SampleInfo[]) {
    this.samples = samples;
    return this;
  }

  withResponses(responses: ResponseItemInfo[]) {
    this.responses = responses;
    return this;
  }

  withComplete(complete: boolean) {
    this.visitCommonInfo.complete = complete;
    return this;
  }

  withLocation(location: string) {
    this.visitCommonInfo.location = location;
    return this;
  }

  withAdministrator(administrator: string) {
    this.visitCommonInfo.administrator = administrator;
    return this;
  }

  withEvents(events: EventInfo[]) {
    this.visitCommonInfo.events = events;
    return this;
  }

  withConsents(consents: (NonPIIConsentInfo | ConsentInfo)[]) {
    this.consents = consents;
    return this;
  }

  withDemoMode() {
    this.isDemo = true;
    return this;
  }

  build(): VisitInfo {
    if (this.isDemo) {
      this.visitCommonInfo.isDemo = true;
    }

    return {
      ...this.visitCommonInfo,
      samples: this.samples.length > 0 ? this.samples : [this.defaultSample],
      giftcards: [],
      consents: this.consents,
      patient: this.patientInfo,
      responses: [
        {
          id: "Questionnaire",
          item:
            this.responses.length > 0
              ? this.responses
              : [this.piiResponseItem, this.nonpiiResponseItem]
        }
      ]
    };
  }
}
