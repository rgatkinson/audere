import { ConsentInfoSignerType } from "audere-lib/snifflesProtocol";
import { getConsentEmailParams } from "../../src/util/visit";
import { VisitInfoBuilder } from "../visitInfoBuilder";

describe("Visit model", () => {
  describe("emailConsent", () => {
    it("Throws an error for incomplete records", () => {
      const visitPII = new VisitInfoBuilder().build();
      const visitNonPII = new VisitInfoBuilder().withComplete(false).build();
      expect(() =>
        getConsentEmailParams(visitPII, visitNonPII, true, false)
      ).toThrow();
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
      const emailParams = getConsentEmailParams(
        visitPII,
        visitNonPII,
        true,
        false
      );
      expect(emailParams).toBeNull();
    });
    it("Sends an email if email requested", () => {
      const visitPII = new VisitInfoBuilder()
        .withConsents([
          {
            name: "Mickey Mouse",
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
      const emailParams = getConsentEmailParams(
        visitPII,
        visitNonPII,
        true,
        false
      );
      expect(emailParams).not.toBeNull();
      expect(emailParams.html)
        .toBe(`<p>Thank you for participating in the Seattle Flu Study!  As requested, we are emailing you a copy of the form signed during your visit.</p>

<p>This email is sent from an unmonitored address.</p><p>Terms terms terms terms...</p><img src=\"cid:signature_0\"/><p>Mickey Mouse, Subject</p><p>Date: 1/1/2019</p>`);
    });
    it("Includes both representative and subject if signed by representative", () => {
      const visitPII = new VisitInfoBuilder()
        .withConsents([
          {
            name: "Minny Mouse",
            terms: "Terms terms terms terms...",
            signerType: ConsentInfoSignerType.Representative,
            relation: "wife",
            date: "1/1/2019"
          }
        ])
        .withName("Mickey Mouse")
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
      const emailParams = getConsentEmailParams(
        visitPII,
        visitNonPII,
        true,
        false
      );
      expect(emailParams).not.toBeNull();
      expect(emailParams.html)
        .toBe(`<p>Thank you for participating in the Seattle Flu Study!  As requested, we are emailing you a copy of the form signed during your visit.</p>

<p>This email is sent from an unmonitored address.</p><p>Terms terms terms terms...</p><img src=\"cid:signature_0\"/><p>Minny Mouse, Representative</p><p>Signed on behalf of Mickey Mouse.</p><p>Relationship of representative to participant: wife</p><p>Date: 1/1/2019</p>`);
    });
    it("Sends an email with multiple forms if email requested", () => {
      const visitPII = new VisitInfoBuilder()
        .withConsents([
          {
            name: "Mickey Mouse",
            terms: "Terms terms terms terms\n\nterms terms terms...",
            signerType: ConsentInfoSignerType.Subject,
            date: "1/1/2019"
          },
          {
            name: "Mickey Mouse",
            terms:
              "**More terms more terms\n\nmore terms more terms**\n\nmore terms more terms...",
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
      const emailParams = getConsentEmailParams(
        visitPII,
        visitNonPII,
        true,
        false
      );
      expect(emailParams).not.toBeNull();
      expect(emailParams.html).toBe(
        `<p>Thank you for participating in the Seattle Flu Study!  As requested, we are emailing you a copy of the 2 forms signed during your visit.</p>

<p>This email is sent from an unmonitored address.</p><p>Terms terms terms terms<br/><br/>terms terms terms...</p><img src=\"cid:signature_0\"/><p>Mickey Mouse, Subject</p><p>Date: 1/1/2019</p><hr/><p><strong>More terms more terms<br/><br/>more terms more terms</strong><br/><br/>more terms more terms...</p><img src=\"cid:signature_1\"/><p>Mickey Mouse, Subject</p><p>Date: 1/1/2019</p>`
      );
    });
    it("Sends an email with multiple forms if email requested", () => {
      const visitPII = new VisitInfoBuilder()
        .withConsents([
          {
            name: "Mickey Mouse",
            terms: "Terms terms terms terms...",
            signerType: ConsentInfoSignerType.Subject,
            date: "1/1/2019"
          },
          {
            name: "Mickey Mouse",
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
      const emailParams = getConsentEmailParams(
        visitPII,
        visitNonPII,
        true,
        false
      );
      expect(emailParams).not.toBeNull();
      expect(emailParams.html)
        .toBe(`<p>Thank you for participating in the Seattle Flu Study!  As requested, we are emailing you a copy of the 2 forms signed during your visit.</p>

<p>This email is sent from an unmonitored address.</p><p>Terms terms terms terms...</p><img src=\"cid:signature_0\"/><p>Mickey Mouse, Subject</p><p>Date: 1/1/2019</p><hr/><p>More terms more terms...</p><img src=\"cid:signature_1\"/><p>Mickey Mouse, Subject</p><p>Date: 1/1/2019</p>`);
    });
    it("Does not include signature image if not requested", () => {
      const visitPII = new VisitInfoBuilder()
        .withConsents([
          {
            name: "Mickey Mouse",
            terms: "Terms terms terms terms\n\nterms terms terms...",
            signerType: ConsentInfoSignerType.Subject,
            date: "1/1/2019"
          },
          {
            name: "Mickey Mouse",
            terms:
              "**More terms more terms\n\nmore terms more terms**\n\nmore terms more terms...",
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
      const emailParams = getConsentEmailParams(
        visitPII,
        visitNonPII,
        false,
        false
      );
      expect(emailParams).not.toBeNull();
      expect(emailParams.html).toBe(
        `<p>Thank you for participating in the Seattle Flu Study!  As requested, we are emailing you a copy of the 2 forms signed during your visit.</p>

<p>This email is sent from an unmonitored address.</p><p>Accepted by Subject Mickey Mouse on 1/1/2019:</p><p>Terms terms terms terms<br/><br/>terms terms terms...</p><hr/><p>Accepted by Subject Mickey Mouse on 1/1/2019:</p><p><strong>More terms more terms<br/><br/>more terms more terms</strong><br/><br/>more terms more terms...</p>`
      );
    });
    it("Sends a specail email if a email without signature images was previously sent to a Seattle Children's participant", () => {
      const visitPII = new VisitInfoBuilder()
        .withConsents([
          {
            name: "Mickey Mouse",
            terms: "Terms terms terms terms\n\nterms terms terms...",
            signerType: ConsentInfoSignerType.Subject,
            date: "1/1/2019"
          },
          {
            name: "Mickey Mouse",
            terms:
              "**More terms more terms\n\nmore terms more terms**\n\nmore terms more terms...",
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
      const emailParams = getConsentEmailParams(
        visitPII,
        visitNonPII,
        true,
        true
      );
      expect(emailParams).not.toBeNull();
      expect(emailParams.html).toBe(
        `<p>Thank you for participating in the Seattle Flu Study!  As requested, we are emailing you a copy of the 2 forms signed during your visit.</p>
<p> We previously sent you an incomplete copy of your forms that did not include your signature. A complete copy of your signed forms is included below.</p>
<p>This email is sent from an unmonitored address.</p><p>Terms terms terms terms<br/><br/>terms terms terms...</p><img src=\"cid:signature_0\"/><p>Mickey Mouse, Subject</p><p>Date: 1/1/2019</p><hr/><p><strong>More terms more terms<br/><br/>more terms more terms</strong><br/><br/>more terms more terms...</p><img src=\"cid:signature_1\"/><p>Mickey Mouse, Subject</p><p>Date: 1/1/2019</p>`
      );
    });
  });
});
