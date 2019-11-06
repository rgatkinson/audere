export interface ButtonConfig {
    enabled: boolean;
    expandableHelpImage?: boolean;
    helpImageUri?: string;
    key: string;
    primary: boolean;
}
export interface ConditionalQuestionConfig {
    answer: string;
    id: string;
    key: string;
    anythingBut?: boolean;
}
export declare enum SurveyQuestionType {
    ButtonGrid = "buttonGrid",
    DatePicker = "datePicker",
    Dropdown = "dropdown",
    MonthPicker = "monthPicker",
    MultiDropdown = "multiDropdown",
    OptionQuestion = "optionQuestion",
    RadioGrid = "radioGrid",
    Text = "text",
    TextInput = "textInput",
    ZipCodeInput = "zipCodeInput"
}
export interface SurveyQuestion {
    buttons: ButtonConfig[];
    conditions?: ConditionalQuestionConfig[] | ConditionalQuestionConfig[][];
    description?: string;
    id: string;
    required?: boolean;
    subquestion?: boolean;
    title?: string;
    type: SurveyQuestionType;
}
export interface OptionQuestion extends SurveyQuestion {
    inclusiveOption?: string;
    exclusiveOptions?: string[];
    options: string[];
}
export interface TextQuestion extends SurveyQuestion {
    placeholder: string;
}
export interface DropDownQuestion extends SurveyQuestion {
    placeholder: string;
}
export interface MonthQuestion extends SurveyQuestion {
    monthRange: number;
}
export interface MultiDropDownQuestion extends SurveyQuestion {
    placeholder: string;
    options: string[];
}
export declare const WhatSymptomsConfig: OptionQuestion;
export declare const SymptomsSeverityConfig: SurveyQuestion;
export declare const FeverSeverityConfig: SurveyQuestion;
export declare const HeadacheSeverityConfig: SurveyQuestion;
export declare const CoughSeverityConfig: SurveyQuestion;
export declare const ChillsSeverityConfig: SurveyQuestion;
export declare const SweatsSeverityConfig: SurveyQuestion;
export declare const SoreThroatSeverityConfig: SurveyQuestion;
export declare const VomitingSeverityConfig: SurveyQuestion;
export declare const RunningNoseSeverityConfig: SurveyQuestion;
export declare const SneezingSeverityConfig: SurveyQuestion;
export declare const FatigueSeverityConfig: SurveyQuestion;
export declare const AchesSeverityConfig: SurveyQuestion;
export declare const TroubleBreathingSeverityConfig: SurveyQuestion;
export declare const WhenFirstNoticedIllnessConfig: SurveyQuestion;
export declare const HowLongToSickestConfig: SurveyQuestion;
export declare const FluOrColdConfig: SurveyQuestion;
export declare const WorseOrDifferentFromTypicalConfig: SurveyQuestion;
export declare const AntiviralConfig: SurveyQuestion;
export declare const WhenFirstStartedAntiviralConfig: SurveyQuestion;
export declare const FluShotConfig: SurveyQuestion;
export declare const FluShotDateConfig: SurveyQuestion;
export declare const HowReceivedFluShotConfig: SurveyQuestion;
export declare const AffectedRegularActivitiesConfig: SurveyQuestion;
export declare const SmokeTobaccoConfig: SurveyQuestion;
export declare const HouseholdTobaccoConfig: SurveyQuestion;
export declare const TravelOutsideStateConfig: SurveyQuestion;
export declare const TravelOutsideUSConfig: SurveyQuestion;
export declare const SpentTimeCityConfig: TextQuestion;
export declare const SpentTimeStateConfig: DropDownQuestion;
export declare const SpentTimeZipCodeConfig: TextQuestion;
export declare const WhichCountriesOutsideUSConfig: MultiDropDownQuestion;
export declare const PeopleInHouseholdConfig: SurveyQuestion;
export declare const ChildrenAgeGroupsConfig: OptionQuestion;
export declare const ChildrenDaycarePreschoolConfig: SurveyQuestion;
export declare const SomeoneDiagnosedConfig: SurveyQuestion;
export declare const InContactConfig: SurveyQuestion;
export declare const PublicTransportationConfig: SurveyQuestion;
export declare const AroundSickChildrenConfig: SurveyQuestion;
export declare const BlueLineConfig: SurveyQuestion;
export declare const PinkWhenBlueConfig: SurveyQuestion;
export declare const SURVEY_QUESTIONS: SurveyQuestion[];
