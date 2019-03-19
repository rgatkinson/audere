import { sendEmail } from "./email";
import {
  ConsentInfoSignerType,
  PatientInfo,
  ResponseItemInfo,
  VisitNonPIIInfo,
  VisitPIIInfo
} from "audere-lib/snifflesProtocol";

type emailConsentResult = {
  emailRequsted: boolean;
  consentsEmailed?: number;
};

export async function emailConsent(
  visitPII: VisitPIIInfo,
  visitNonPII: VisitNonPIIInfo,
  includeSignatures: boolean,
  includeResendingMessage: boolean = false
): Promise<emailConsentResult> {
  const emailParams = getConsentEmailParams(
    visitPII,
    visitNonPII,
    includeSignatures,
    includeResendingMessage
  );
  if (!emailParams) {
    return {
      emailRequsted: false
    };
  }
  await sendEmail(emailParams);
  return {
    emailRequsted: true,
    consentsEmailed: emailParams.consentCount
  };
}

const getResendingMessage = (formCount, resendingWithSignature) => {
  if (!resendingWithSignature) {
    return "";
  }
  const forms = formCount === 1 ? "form" : "forms";
  return `<p> We previously sent you an incomplete copy of your ${forms} that did not include your signature. A complete copy of your signed ${forms} is included below.</p>`;
};

const getPreamble = (formCount, resendingWithSignature) =>
  `<p>Thank you for participating in the Seattle Flu Study!  As requested, we are emailing you a copy of the ${
    formCount === 1 ? "form" : formCount + " forms"
  } signed during your visit.</p>
${getResendingMessage(formCount, resendingWithSignature)}
<p>This email is sent from an unmonitored address.</p>`;

// Implements the psuedo-markdown we use for rendering consent forms
function toHTML(text) {
  text = text.replace(/\n/g, "<br/>");
  let bold = false;
  text = text.replace(/\*\*/g, () => {
    bold = !bold;
    return bold ? "<strong>" : "</strong>";
  });
  return "<p>" + text + "</p>";
}

export function getConsentEmailParams(
  visitPII: VisitPIIInfo,
  visitNonPII: VisitNonPIIInfo,
  includeSignatures: boolean,
  includeResendingMessage: boolean
) {
  if (!visitNonPII.complete) {
    throw new Error(
      "Attempting to send consent email before visit is complete."
    );
  }
  if (visitPII.consents.length === 0 || visitNonPII.isDemo) {
    return null;
  }
  const enrolledItem = getResponseItem(visitNonPII, "Enrolled");
  if (!enrolledItem) {
    return null;
  }
  const shouldEmailConsent =
    isOptionSelected(enrolledItem, "sendCopyOfMyConsent") ||
    isOptionSelected(enrolledItem, "allOfTheAbove");
  if (!shouldEmailConsent) {
    return null;
  }

  const patientEmailAddresses = getPatientEmailAddresses(visitPII.patient);

  const signatures = [];
  const body =
    getPreamble(visitPII.consents.length, includeResendingMessage) +
    visitPII.consents
      .map((consent, index) => {
        const cid = `signature_${index}`;
        signatures.push({
          filename: `${cid}.png`,
          content: consent.signature,
          cid,
          encoding: "base64"
        });
        if (includeSignatures) {
          return (
            toHTML(consent.terms) +
            `<img src="cid:${cid}"/>` +
            `<p>${consent.name}, ${consent.signerType}</p>` +
            (consent.signerType === ConsentInfoSignerType.Representative
              ? `<p>Signed on behalf of ${
                  visitPII.patient.name
                }.</p><p>Relationship of representative to participant: ${
                  consent.relation
                }</p>`
              : "") +
            `<p>Date: ${consent.date}</p>`
          );
        } else {
          return (
            `<p>Accepted by ${consent.signerType} ${consent.name} on ${
              consent.date
            }:</p>` + toHTML(consent.terms)
          );
        }
      })
      .join("<hr/>");

  return {
    subject: "Seattle Flu Study Consent Form",
    html: body,
    to: patientEmailAddresses,
    from: "noreply@auderenow.org",
    attachments: signatures,
    consentCount: visitPII.consents.length
  };
}

function getPatientEmailAddresses(patient: PatientInfo) {
  return patient.telecom
    .filter(telecom => telecom.system === "email")
    .map(telecom => telecom.value);
}

function getResponseItem(
  visit: VisitPIIInfo | VisitNonPIIInfo,
  id: string
): ResponseItemInfo {
  if (visit.responses.length === 0) {
    return null;
  }

  const items = visit.responses[0].item.filter(item => item.id === id);
  if (items.length === 0) {
    return null;
  }
  return items[0];
}

function isOptionSelected(
  responseItem: ResponseItemInfo,
  optionId: string
): boolean {
  const optionIndex = responseItem.answerOptions.findIndex(
    option => option.id === optionId
  );
  return responseItem.answer.some(answer => answer.valueIndex === optionIndex);
}
