// Copyright (c) 2018 by Audere
//
// Use of this source code is governed by an MIT-style license that
// can be found in the LICENSE file distributed with this file.

import { VisitNonPIIInfo, EventInfoKind } from "audere-lib/snifflesProtocol";
import { mapEncounter } from "../../src/mappers/encounterMapper";
import { NonPIIVisitDetails } from "../../src/models/visitDetails";
import {
  schemaVersion,
  Location,
  LocationUse,
  NumberAnswer,
  OptionAnswer,
  StringAnswer
} from "audere-lib/hutchProtocol";
import { LocationType } from "audere-lib/locations";
import moment from "moment";

describe("encounter mapper", () => {
  class VisitBuilder {
    private visitId: string = "visit";
    private visitInfo: VisitNonPIIInfo = {
      complete: true,
      samples: [],
      giftcards: [],
      responses: [],
      events: []
    };
    private consentDate: string;
    private participant: string;
    private household: Location;
    private tempLocation: Location;
    private workplace: Location;

    withVisitId(visitId) {
      this.visitId = visitId;
      return this;
    }

    withConsentDate(consentDate) {
      this.consentDate = consentDate;
      return this;
    }

    withParticipant(participant) {
      this.participant = participant;
      return this;
    }

    withHousehold(homeAddress, homeRegion) {
      this.household = {
        use: LocationUse.Home,
        id: homeAddress,
        region: homeRegion
      };
      return this;
    }

    withTemporaryLocation(tempAddres, tempRegion) {
      this.tempLocation = {
        use: LocationUse.Temp,
        id: tempAddres,
        region: tempRegion
      };
      return this;
    }

    withWorkplace(workAddress, workRegion) {
      this.workplace = {
        use: LocationUse.Work,
        id: workAddress,
        region: workRegion
      };
      return this;
    }

    withLocation(location) {
      this.visitInfo.location = location;
      return this;
    }

    withResponse(response) {
      this.visitInfo.responses.push(response);
      return this;
    }

    withSample(sampleType, code) {
      this.visitInfo.samples.push({ sample_type: sampleType, code: code });
      return this;
    }

    withStartTime(startTime) {
      this.visitInfo.events.push({ kind: EventInfoKind.Visit, at: startTime });
      return this;
    }

    build(): NonPIIVisitDetails {
      return {
        id: 1,
        visitId: this.visitId,
        visitInfo: this.visitInfo,
        consentDate: this.consentDate,
        participant: this.participant,
        locations: [this.household, this.tempLocation, this.workplace].filter(
          x => x != null
        )
      };
    }
  }

  describe("map encounter", () => {
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

    it("converts visit details into an encounter", async () => {
      const now = moment().toISOString();
      const visit = new VisitBuilder()
        .withVisitId("asdf")
        .withHousehold("beach house", "beach")
        .withTemporaryLocation("vacation", "europe")
        .withWorkplace("company", "city")
        .withLocation("Harborview")
        .withStartTime(now)
        .withResponse(response1)
        .build();

      const encounter = mapEncounter(visit);

      expect(encounter.schemaVersion).toBe(schemaVersion);
      expect(encounter.id).toBe("asdf");
      expect(encounter.locations).toContainEqual({
        use: LocationUse.Home,
        id: "beach house",
        region: "beach"
      });
      expect(encounter.locations).toContainEqual({
        use: LocationUse.Temp,
        id: "vacation",
        region: "europe"
      });
      expect(encounter.locations).toContainEqual({
        use: LocationUse.Work,
        id: "company",
        region: "city"
      });
      expect(encounter.site.type).toBe(LocationType.Hospital);
      expect(encounter.startTimestamp).toBe(now);
    });

    it("requires a start timestamp", async () => {
      const visit = new VisitBuilder()
        .withVisitId("asdf")
        .withHousehold("beach house", "beach")
        .withTemporaryLocation("vacation", "europe")
        .withWorkplace("company", "city")
        .withLocation("hospital")
        .withResponse(response1)
        .build();

      expect(() => mapEncounter(visit)).toThrow();
    });

    it("converts visit responses", async () => {
      const now = moment().toISOString();
      const visit = new VisitBuilder()
        .withResponse(response1)
        .withResponse(response2)
        .withStartTime(now)
        .build();
      const encounter = mapEncounter(visit);

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

    it("errors when there are any address-value answers", async () => {
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

      const input = new VisitBuilder().withResponse(response).build();

      expect(() => mapEncounter(input)).toThrow();
    });

    it("errors when there is no visit info", async () => {
      const input = new VisitBuilder().build();
      input.visitInfo = undefined;

      expect(() => mapEncounter(input)).toThrow();
    });

    it("errors when there are no responses", async () => {
      const input = new VisitBuilder().build();
      input.visitInfo.responses = undefined;

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
      const input = new VisitBuilder()
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
      const input = new VisitBuilder()
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
});
