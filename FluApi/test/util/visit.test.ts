import { ConsentInfoSignerType } from "audere-lib/snifflesProtocol";
import { getConsentEmailParams } from "../../src/util/visit";
import { VisitInfoBuilder } from "../visitInfoBuilder";

describe("Visit model", () => {
  describe("emailConsent", () => {
    it("Throws an error for incomplete records", () => {
      const visitPII = new VisitInfoBuilder().build();
      const visitNonPII = new VisitInfoBuilder().withComplete(false).build();
      expect(() => getConsentEmailParams(visitPII, visitNonPII)).toThrow();
    });
    it("Sends no email if no email requested", () => {
      const visitPII = new VisitInfoBuilder().build();
      const visitNonPII = new VisitInfoBuilder()
        .withResponses([
          {
            id: "Enrolled",
            text:
              "We would like to email you. Please select when we may email you, and provide your email address (optional).",
            answerOptions: [
              {
                id: "sendCopyOfMyConsent",
                text: "Send me a copy of my consent"
              },
              {
                id: "askAboutMyIllness",
                text: "To ask me questions about my illness/cold"
              },
              {
                id: "learnAboutStudy",
                text: "To learn more about this study and related topics"
              },
              { id: "allOfTheAbove", text: "All of the above" },
              { id: "doNotEmailMe", text: "Please do not email me" }
            ],
            answer: [{ valueIndex: 4 }]
          }
        ])
        .build();
      const emailParams = getConsentEmailParams(visitPII, visitNonPII);
      expect(emailParams).toBeNull();
    });
    it("Sends an email if email requested", () => {
      const visitPII = new VisitInfoBuilder()
        .withConsents([
          {
            terms: "Terms terms terms terms...",
            signerType: ConsentInfoSignerType.Subject,
            date: "1/1/2019"
          }
        ])
        .build();
      const visitNonPII = new VisitInfoBuilder()
        .withResponses([
          {
            id: "Enrolled",
            text:
              "We would like to email you. Please select when we may email you, and provide your email address (optional).",
            answerOptions: [
              {
                id: "sendCopyOfMyConsent",
                text: "Send me a copy of my consent"
              },
              {
                id: "askAboutMyIllness",
                text: "To ask me questions about my illness/cold"
              },
              {
                id: "learnAboutStudy",
                text: "To learn more about this study and related topics"
              },
              { id: "allOfTheAbove", text: "All of the above" },
              { id: "doNotEmailMe", text: "Please do not email me" }
            ],
            answer: [{ valueIndex: 3 }]
          }
        ])
        .build();
      const emailParams = getConsentEmailParams(visitPII, visitNonPII);
      expect(emailParams).not.toBeNull();
      expect(emailParams.body)
        .toBe(`Thank you for participating in the Seattle Flu Study!  As requested, we are emailing you a copy of the form you signed.

This email is sent from an unmonitored address.

Signed on 1/1/2019:
Terms terms terms terms...`);
    });
    it("Sends an email with multiple forms if email requested", () => {
      const visitPII = new VisitInfoBuilder()
        .withConsents([
          {
            terms: "Terms terms terms terms...",
            signerType: ConsentInfoSignerType.Subject,
            date: "1/1/2019"
          },
          {
            terms: "More terms more terms...",
            signerType: ConsentInfoSignerType.Subject,
            date: "1/1/2019"
          }
        ])
        .build();
      const visitNonPII = new VisitInfoBuilder()
        .withResponses([
          {
            id: "Enrolled",
            text:
              "We would like to email you. Please select when we may email you, and provide your email address (optional).",
            answerOptions: [
              {
                id: "sendCopyOfMyConsent",
                text: "Send me a copy of my consent"
              },
              {
                id: "askAboutMyIllness",
                text: "To ask me questions about my illness/cold"
              },
              {
                id: "learnAboutStudy",
                text: "To learn more about this study and related topics"
              },
              { id: "allOfTheAbove", text: "All of the above" },
              { id: "doNotEmailMe", text: "Please do not email me" }
            ],
            answer: [{ valueIndex: 3 }]
          }
        ])
        .build();
      const emailParams = getConsentEmailParams(visitPII, visitNonPII);
      expect(emailParams).not.toBeNull();
      expect(emailParams.body)
        .toBe(`Thank you for participating in the Seattle Flu Study!  As requested, we are emailing you a copy of the 2 forms you signed.

This email is sent from an unmonitored address.

Signed on 1/1/2019:
Terms terms terms terms...

Signed on 1/1/2019:
More terms more terms...`);
    });
  });
});
