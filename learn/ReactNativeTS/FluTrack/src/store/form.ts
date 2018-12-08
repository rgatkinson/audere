import uuidv4 from "uuid/v4";

export type FormAction =
  | { type: "START_FORM" }
  | { type: "COMPLETE_SURVEY" }
  | { type: "SET_SIGNATURE_PNG"; signatureBase64: string }
  | { type: "SET_BLOOD_SIGNATURE_PNG"; signatureBase64: string }
  | { type: "SET_NAME"; name: string }
  | { type: "SET_EMAIL"; email: string }
  | { type: "SET_CONSENT_TERMS"; consentTerms: string }
  | { type: "SET_BLOOD_CONSENT_TERMS"; consentTerms: string }
  | {
      type: "SET_SURVEY_RESPONSES";
      surveyResponses: Map<string, SurveyResponse>;
    };

export interface Address {
  location?: string;
  address?: string;
  city?: string;
  state?: string;
  zipcode?: string;
  country?: string;
}

export interface SurveyAnswer {
  addressInput?: Address;
  dateInput?: Date;
  options?: Map<string, boolean>;
  otherOption?: string;
  numberInput?: number;
  selectedButtonKey?: string;
  textInput?: string;
  [key: string]:
    | Address
    | Date
    | Map<string, boolean>
    | string
    | number
    | undefined;
}

export interface SurveyResponse {
  answer?: SurveyAnswer;
  buttonOptions?: Map<string, string>;
  optionKeysToLabel?: Map<string, string>;
  questionId: string;
  questionText: string;
}

export type FormState = {
  completedSurvey: boolean;
  formId?: string;
  name?: string;
  email?: string;
  consentTerms?: string;
  bloodConsentTerms?: string;
  signatureBase64?: string;
  bloodSignatureBase64?: string;
  surveyResponses?: Map<string, SurveyResponse>;
};

const initialState: FormState = {
  completedSurvey: false,
};

export default function reducer(state = initialState, action: FormAction) {
  if (action.type === "START_FORM") {
    // Resets all form data
    return { formId: uuidv4(), completedSurvey: false };
  }
  if (action.type === "COMPLETE_SURVEY") {
    return { ...state, completedSurvey: true };
  }
  if (action.type === "SET_NAME") {
    return { ...state, name: action.name };
  }
  if (action.type === "SET_EMAIL") {
    return { ...state, email: action.email };
  }
  if (action.type === "SET_CONSENT_TERMS") {
    return { ...state, consentTerms: action.consentTerms };
  }
  if (action.type === "SET_BLOOD_CONSENT_TERMS") {
    return { ...state, bloodConsentTerms: action.consentTerms };
  }
  if (action.type === "SET_SIGNATURE_PNG") {
    return { ...state, signatureBase64: action.signatureBase64 };
  }
  if (action.type === "SET_BLOOD_SIGNATURE_PNG") {
    return { ...state, bloodSignatureBase64: action.signatureBase64 };
  }
  if (action.type === "SET_SURVEY_RESPONSES") {
    return { ...state, surveyResponses: action.surveyResponses };
  }
  return state;
}

export function startForm(): FormAction {
  return {
    type: "START_FORM",
  };
}

export function completeSurvey(): FormAction {
  return {
    type: "COMPLETE_SURVEY",
  };
}

export function setName(name: string): FormAction {
  return {
    type: "SET_NAME",
    name,
  };
}

export function setEmail(email: string): FormAction {
  return {
    type: "SET_EMAIL",
    email,
  };
}

export function setSignaturePng(signatureBase64: string): FormAction {
  return {
    type: "SET_SIGNATURE_PNG",
    signatureBase64,
  };
}

export function setBloodSignaturePng(signatureBase64: string): FormAction {
  return {
    type: "SET_BLOOD_SIGNATURE_PNG",
    signatureBase64,
  };
}

export function setConsentTerms(consentTerms: string): FormAction {
  return {
    type: "SET_CONSENT_TERMS",
    consentTerms,
  };
}

export function setBloodConsentTerms(consentTerms: string): FormAction {
  return {
    type: "SET_BLOOD_CONSENT_TERMS",
    consentTerms,
  };
}

export function setSurveyResponses(
  surveyResponses: Map<string, SurveyResponse>
): FormAction {
  return {
    type: "SET_SURVEY_RESPONSES",
    surveyResponses,
  };
}
