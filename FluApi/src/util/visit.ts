import { sendEmail } from "./email";
import {
  PatientInfo,
  ResponseItemInfo,
  VisitNonPIIInfo,
  VisitPIIInfo
} from "audere-lib/snifflesProtocol";

export async function emailConsent(
  visitPII: VisitPIIInfo,
  visitNonPII: VisitNonPIIInfo
) {
  const emailParams = getConsentEmailParams(visitPII, visitNonPII);
  if (!emailParams) {
    return;
  }
  await sendEmail(emailParams);
}

const CONSENT_BODY_PREAMBLE = `Thank you for participating in the Seattle Flu Study!  As requested, we are emailing you a copy of the consent form you signed.

This email is sent from an unmonitored address.  Please contact us at feedback@auderenow.org to unsubscribe from future emails, or if you have any other questions or concerns.

Here are copies of the Consent Forms you accepted:

`;

export function getConsentEmailParams(
  visitPII: VisitPIIInfo,
  visitNonPII: VisitNonPIIInfo
) {
  if (!visitNonPII.complete || visitNonPII.isDemo) {
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

  const body =
    CONSENT_BODY_PREAMBLE +
    visitPII.consents
      .map(consent => "Signed on " + consent.date + ":\n" + consent.terms)
      .join("\n\n");

  return {
    subject: "Seattle Flu Study Consent Form",
    body: body,
    to: patientEmailAddresses,
    from: "noreply@auderenow.org"
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
