import { sendEmail } from "./email";
import {
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
  visitNonPII: VisitNonPIIInfo
): Promise<emailConsentResult> {
  const emailParams = getConsentEmailParams(visitPII, visitNonPII);
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

const getPreamble = formCount =>
  `Thank you for participating in the Seattle Flu Study!  As requested, we are emailing you a copy of the ${
    formCount === 1 ? "form" : formCount + " forms"
  } you signed.

This email is sent from an unmonitored address.

`;

export function getConsentEmailParams(
  visitPII: VisitPIIInfo,
  visitNonPII: VisitNonPIIInfo
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

  const body =
    getPreamble(visitPII.consents.length) +
    visitPII.consents
      .map(consent => "Signed on " + consent.date + ":\n" + consent.terms)
      .join("\n\n");

  return {
    subject: "Seattle Flu Study Consent Form",
    body: body,
    to: patientEmailAddresses,
    from: "noreply@auderenow.org",
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
