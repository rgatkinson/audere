export interface Address {
  name?: string;
  address?: string;
  address2?: string;
  city?: string;
  state?: string;
  zipcode?: string;
}

export interface Option {
  key: string;
  selected: boolean;
}

export interface ButtonLabel {
  key: string;
  label: string;
}

export interface OptionLabel {
  key: string;
  label: string;
}

export interface SurveyAnswer {
  addressInput?: Address;
  booleanInput?: boolean;
  dateInput?: Date;
  options?: Option[];
  otherOption?: string;
  numberInput?: number;
  selectedButtonKey?: string;
  textInput?: string;
  [key: string]:
    | Address
    | Date
    | Option[]
    | boolean
    | string
    | number
    | undefined;
}

export interface SurveyResponse {
  answer?: SurveyAnswer;
  buttonLabels?: ButtonLabel[];
  optionLabels?: OptionLabel[];
  questionId: string;
  questionText: string;
}
