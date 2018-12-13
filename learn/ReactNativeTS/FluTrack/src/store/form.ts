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
  | { type: "SET_SAMPLES"; samples: Sample[] }
  | { type: "SET_RESPONSES"; responses: SurveyResponse[] };

export interface Address {
  location?: string;
  address?: string;
  city?: string;
  state?: string;
  zipcode?: string;
  country?: string;
}

export interface Sample {
  sampleType: string;
  code: string;
}

export interface Option {
  key: string;
  selected: boolean;
}

export interface SurveyAnswer {
  addressInput?: Address;
  dateInput?: Date;
  options?: Option[];
  otherOption?: string;
  numberInput?: number;
  selectedButtonKey?: string;
  textInput?: string;
  [key: string]: Address | Date | Option[] | string | number | undefined;
}

export interface ButtonLabel {
  key: string;
  label: string;
}

export interface OptionLabel {
  key: string;
  label: string;
}

export interface SurveyResponse {
  answer?: SurveyAnswer;
  buttonLabels?: ButtonLabel[];
  optionLabels?: OptionLabel[];
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
  responses: SurveyResponse[];
  samples?: Sample[];
};

const initialState: FormState = {
  completedSurvey: false,
  responses: [],
};

export default function reducer(state = initialState, action: FormAction) {
  if (action.type === "START_FORM") {
    // Resets all form data
    return { ...initialState, formId: uuidv4() };
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
  if (action.type === "SET_SAMPLES") {
    return { ...state, samples: action.samples };
  }
  if (action.type === "SET_RESPONSES") {
    return { ...state, responses: action.responses };
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

export function setSamples(samples: Sample[]): FormAction {
  return {
    type: "SET_SAMPLES",
    samples,
  };
}

export function setResponses(responses: SurveyResponse[]): FormAction {
  return {
    type: "SET_RESPONSES",
    responses,
  };
}
