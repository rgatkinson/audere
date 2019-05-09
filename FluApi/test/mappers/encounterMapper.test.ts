// Copyright (c) 2018 by Audere
//
// Use of this source code is governed by an MIT-style license that
// can be found in the LICENSE file distributed with this file.

import { mapEncounter } from "../../src/mappers/encounterMapper";
import { NonPIIEncounterDetails } from "../../src/models/encounterDetails";
import {
  schemaVersion,
  Location,
  LocationUse,
  NumberAnswer,
  OptionAnswer,
  StringAnswer,
  EventType
} from "audere-lib/hutchProtocol";
import { LocationType } from "audere-lib/locations";
import moment from "moment";
import { FollowUpSurveyData } from "../../src/external/redCapClient";

describe("encounter mapper", () => {
  class DetailsBuilder {
    private consentDate: string;
    private encounterId: string = "visit";
    private location: string;
    private participant: string;
    private startTime: string;
    private events = [];
    private responses = [];
    private samples = [];
    private household: Location;
    private tempLocation: Location;
    private workplace: Location;
    private followUpResponses: FollowUpSurveyData

    withConsentDate(consentDate) {
      this.consentDate = consentDate;
      return this;
    }

    withEncounterId(encounterId) {
      this.encounterId = encounterId;
      return this;
    }

    withEvent(refId, at) {
      this.events.push({ refId: refId, at: at });
      return this;
    }

    withHousehold(homeAddress, homeRegion, homeCity, homeState) {
      this.household = {
        use: LocationUse.Home,
        id: homeAddress,
        region: homeRegion,
        city: homeCity,
        state: homeState
      };
      return this;
    }

    withLocation(location) {
      this.location = location;
      return this;
    }

    withParticipant(participant) {
      this.participant = participant;
      return this;
    }

    withTemporaryLocation(tempAddress, tempRegion, tempCity, tempState) {
      this.tempLocation = {
        use: LocationUse.Temp,
        id: tempAddress,
        region: tempRegion,
        city: tempCity,
        state: tempState
      };
      return this;
    }

    withWorkplace(workAddress, workRegion, workCity, workState) {
      this.workplace = {
        use: LocationUse.Work,
        id: workAddress,
        region: workRegion,
        city: workCity,
        state: workState
      };
      return this;
    }

    withResponse(response) {
      this.responses.push(response);
      return this;
    }

    withFollowUpResponses(responses) {
      this.followUpResponses = responses;
      return this;
    }

    withSample(sampleType, code) {
      this.samples.push({ sample_type: sampleType, code: code });
      return this;
    }

    withStartTime(startTime) {
      this.startTime = startTime;
      return this;
    }

    build(): NonPIIEncounterDetails {
      return {
        id: 1,
        encounterId: this.encounterId,
        consentDate: this.consentDate,
        startTime: this.startTime,
        site: this.location,
        responses: this.responses,
        locations: [this.household, this.tempLocation, this.workplace].filter(
          x => x != null
        ),
        samples: this.samples,
        events: this.events,
        participant: this.participant,
        followUpResponses: this.followUpResponses
      };
    }
  }

  const response1 = {
    id: "r1",
    item: [
      {
        id: "r1",
        text: "Do you like cookies?",
        answer: [
          {
            valueString: "Yes"
          }
        ]
      }
    ]
  };

  const response2 = {
    id: "r2",
    item: [
      {
        id: "r2",
        text: "How many cookies did you eat yesterday?",
        answer: [
          {
            valueInteger: 4
          }
        ]
      }
    ]
  };

  describe("map encounter", () => {
    it("converts encounter details into an encounter", async () => {
      const now = moment().toISOString();
      const details = new DetailsBuilder()
        .withEncounterId("asdf")
        .withHousehold("beach house", "beach", "Malibu", "CA")
        .withTemporaryLocation("vacation", "carribean", "Key West", "FL")
        .withWorkplace("company", "city", "Seattle", "WA")
        .withLocation("Harborview")
        .withStartTime(now)
        .withResponse(response1)
        .build();

      const encounter = mapEncounter(details);

      expect(encounter.schemaVersion).toBe(schemaVersion);
      expect(encounter.id).toBe("asdf");
      expect(encounter.locations).toContainEqual({
        use: LocationUse.Home,
        id: "beach house",
        region: "beach",
        city: "Malibu",
        state: "CA"
      });
      expect(encounter.locations).toContainEqual({
        use: LocationUse.Temp,
        id: "vacation",
        region: "carribean",
        city: "Key West",
        state: "FL"
      });
      expect(encounter.locations).toContainEqual({
        use: LocationUse.Work,
        id: "company",
        region: "city",
        city: "Seattle",
        state: "WA"
      });
      expect(encounter.site.type).toBe(LocationType.Hospital);
      expect(encounter.startTimestamp).toBe(now);
    });

    it("requires a start timestamp", async () => {
      const details = new DetailsBuilder()
        .withEncounterId("asdf")
        .withHousehold("beach house", "beach", "Malibu", "CA")
        .withTemporaryLocation("vacation", "carribean", "Key West", "FL")
        .withWorkplace("company", "city", "Seattle", "WA")
        .withLocation("hospital")
        .withResponse(response1)
        .build();

      expect(() => mapEncounter(details)).toThrow();
    });

    it("maps events", async () => {
      const now = moment();
      const consentDate = now.subtract(1, "days").toISOString();
      const barcodeDate = now.subtract(2, "days").toISOString();
      const questionnaireDate = now.subtract(3, "days").toISOString();
      const screeningDate = now.subtract(4, "days").toISOString();

      const details = new DetailsBuilder()
        .withConsentDate(consentDate)
        .withEvent("ManualConfirmation", barcodeDate)
        .withEvent("WhenSymptoms", questionnaireDate)
        .withEvent("ThankYouScreening", screeningDate)
        .withResponse(response1)
        .withStartTime(now.toISOString())
        .build();
      const encounter = mapEncounter(details);

      expect(encounter.events).toHaveLength(4);

      expect(encounter.events).toContainEqual({
        time: consentDate,
        eventType: EventType.ConsentSigned
      });

      expect(encounter.events).toContainEqual({
        time: barcodeDate,
        eventType: EventType.BarcodeScanned
      });

      expect(encounter.events).toContainEqual({
        time: questionnaireDate,
        eventType: EventType.StartedQuestionnaire
      });

      expect(encounter.events).toContainEqual({
        time: screeningDate,
        eventType: EventType.SymptomsScreened
      });
    });

    it("maps the most recent event when there is overlap", async () => {
      const now = moment();
      const date1 = now.subtract(1, "days");
      const date2 = now.subtract(2, "days");
      const date3 = now.subtract(3, "days");

      const details = new DetailsBuilder()
        .withEvent("ManualConfirmation", date1)
        .withEvent("ScanConfirmation", date2)
        .withEvent("ManualConfirmation", date3)
        .withResponse(response1)
        .withStartTime(now.toISOString())
        .build();
      const encounter = mapEncounter(details);

      expect(encounter.events).toHaveLength(1);

      expect(encounter.events[0]).toEqual({
        time: date1,
        eventType: EventType.BarcodeScanned
      });
    });

    it("maps responses", async () => {
      const now = moment().toISOString();
      const details = new DetailsBuilder()
        .withResponse(response1)
        .withResponse(response2)
        .withStartTime(now)
        .build();
      const encounter = mapEncounter(details);

      expect(encounter.responses.length).toBe(2);
      const c1 = encounter.responses.find(
        r =>
          r.question.token === "r1" &&
          r.question.text === "Do you like cookies?"
      );
      expect(c1).not.toBeUndefined();
      expect(c1.answer.type).toBe("String");
      expect((<StringAnswer>c1.answer).value).toBeTruthy();
      const c2 = encounter.responses.find(
        r =>
          r.question.token === "r2" &&
          r.question.text === "How many cookies did you eat yesterday?"
      );
      expect(c2).not.toBeUndefined();
      expect(c2.answer.type).toBe("Number");
      expect((<NumberAnswer>c2.answer).value).toBe(4);
    });

    it("errors when there are only address-value answers", async () => {
      const response = {
        id: "r1",
        item: [
          {
            id: "r1",
            text: "Where are you going?",
            answer: [
              {
                valueAddress: {
                  line: ["400 Broad St"],
                  city: "Seattle",
                  state: "WA",
                  postalCode: "98109",
                  country: "US"
                }
              }
            ]
          }
        ]
      };

      const input = new DetailsBuilder().withResponse(response).build();

      expect(() => mapEncounter(input)).toThrow();
    });

    it("errors when there are no responses", async () => {
      const input = new DetailsBuilder().build();
      input.responses = undefined;

      expect(() => mapEncounter(input)).toThrow();
    });

    it("collects select option values into the response", async () => {
      const response = {
        id: "r1",
        item: [
          {
            id: "r1",
            text: "What is your favorite color?",
            answer: [
              {
                valueIndex: 0
              },
              {
                valueIndex: 3
              }
            ],
            answerOptions: [
              {
                id: "0",
                text: "Blue"
              },
              {
                id: "1",
                text: "Green"
              },
              {
                id: "2",
                text: "Red"
              },
              {
                id: "3",
                text: "Yellow"
              }
            ]
          }
        ]
      };

      const now = moment().toISOString();
      const input = new DetailsBuilder()
        .withResponse(response)
        .withStartTime(now)
        .build();
      const output = mapEncounter(input);

      expect(output.responses.length).toBe(1);
      const options = output.responses[0].options;
      expect(options.length === 4);
      expect(options.some(x => x.token === "0" && x.text === "Blue")).toBe(
        true
      );
      expect(options.some(x => x.token === "1" && x.text === "Green")).toBe(
        true
      );
      expect(options.some(x => x.token === "2" && x.text === "Red")).toBe(true);
      expect(options.some(x => x.token === "3" && x.text === "Yellow")).toBe(
        true
      );
    });

    it("collects multi-select option-value answers into a single record", async () => {
      const response = {
        id: "r1",
        item: [
          {
            id: "r1",
            text: "What is your favorite color?",
            answer: [
              {
                valueIndex: 0
              },
              {
                valueIndex: 3
              }
            ],
            answerOptions: [
              {
                id: "0",
                text: "Blue"
              },
              {
                id: "1",
                text: "Green"
              },
              {
                id: "2",
                text: "Red"
              },
              {
                id: "3",
                text: "Yellow"
              }
            ]
          }
        ]
      };

      const now = moment().toISOString();
      const input = new DetailsBuilder()
        .withResponse(response)
        .withStartTime(now)
        .build();
      const output = mapEncounter(input);

      expect(output.responses.length).toBe(1);
      const a = output.responses[0].answer as OptionAnswer;
      expect(a.chosenOptions.length).toBe(2);
      expect(a.chosenOptions.some(x => x === 0)).toBe(true);
      expect(a.chosenOptions.some(x => x === 3)).toBe(true);
    });
  });

  it("maps follow up survey responses", async () => {
    const surveyData = {
      record_id: 1,
      email: "zaza@mail.com",
      daily_activity: 1,
      medications: 2,
      care___1: 0,
      care___2: 1,
      care___3: 0,
      care___4: 1,
      care___5: 0,
      care___6: 1,
      care___7: 0,
      care___8: 0,
      care_other: undefined,
      found_study: 3
    };

    const now = moment().toISOString();
    const details = new DetailsBuilder()
      .withEncounterId("asdf")
      .withStartTime(now)
      .withResponse(response1)
      .withFollowUpResponses(surveyData)
      .build();

    const encounter = mapEncounter(details);

    expect(encounter.responses).toContainEqual(
      expect.objectContaining({
        question: {
          token: "daily_activity",
          text: "Over the last week, did your illness prevent you from going to work or school, going to a social event, or exercising/working out?"
        },
        options: [
          {
            token: "no",
            text: "No"
          },
          {
            token: "yes",
            text: "Yes"
          }
        ],
        answer: {
          type: "Option",
          chosenOptions: [surveyData.daily_activity]
        }
      })
    );

    expect(encounter.responses).toContainEqual(
      expect.objectContaining({
        question: {
          token: "medications",
          text: "Are you currently taking antibiotics (e.g. Amoxiil, penicilin, Z-pack, Bactrim, Agumentin) or antivirals (e.g. Tamiflu, Xofluza, Relenza) for this illness?"
        },
        options: [
          {
            token: "yes",
            text: "Yes"
          },
          {
            token: "no",
            text: "No"
          },
          {
            token: "doNotKnow",
            text: "Do not Know"
          }
        ],
        answer: {
          type: "Option",
          chosenOptions: [1]
        }
      })
    );

    expect(encounter.responses).toContainEqual(
      expect.objectContaining({
        question: {
          token: "care",
          text: "In the last week did you go to any of the following for health care treatment or advice about your illness? (Select any you visited or received advice from)"
        },
        options: [
          {
            token: "care___1",
            text: "Pharmacy"
          },
          {
            token: "care___2",
            text: "Primary care clinic"
          },
          {
            token: "care___3",
            text: "Urgent care clinic"
          },
          {
            token: "care___4",
            text: "Naturopath"
          },
          {
            token: "care___5",
            text: "Online health care provider"
          },
          {
            token: "care___6",
            text: "Emergency department"
          },
          {
            token: "care___7",
            text: "Other"
          },
          {
            token: "care___8",
            text: "None of the above"
          }
        ],
        answer: {
          type: "Option",
          chosenOptions: [1, 3, 5]
        }
      })
    );

    expect(encounter.responses).toContainEqual(
      expect.objectContaining({
        question: {
          token: "found_study",
          text: "How did you hear about the flu@home study?"
        },
        options: [
          {
            token: "onlineSearch",
            text: "Online search"
          },
          {
            token: "couponSite",
            text: "Coupon site"
          },
          {
            token: "appStore",
            text: "App Store"
          },
          {
            token: "fluNearYou",
            text: "Flu Near You community"
          },
          {
            token: "friend",
            text: "A friend"
          },
          {
            token: "onlineAd",
            text: "Other online ad"
          },
          {
            token: "localClinic",
            text: "Local health clinic"
          },
          {
            token: "other",
            text: "Other"
          }
        ],
        answer: {
          type: "Option",
          chosenOptions: [2]
        }
      })
    );
  });
});
