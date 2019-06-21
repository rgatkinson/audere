export interface ButtonConfig {
    enabled: boolean;
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
    OptionQuestion = "optionQuestion",
    RadioGrid = "radioGrid",
    Text = "text",
    TextInput = "textInput"
}
export interface SurveyQuestion {
    buttons: ButtonConfig[];
    conditions?: ConditionalQuestionConfig[];
    description?: string;
    id: string;
    required?: boolean;
    subquestion?: boolean;
    title: string;
    type: SurveyQuestionType;
}
export interface OptionQuestion extends SurveyQuestion {
    inclusiveOption?: string;
    exclusiveOptions?: string[];
    options: string[];
}
export interface DropDownQuestion extends SurveyQuestion {
    placeholder: string;
}
export declare const ConsentConfig: SurveyQuestion[];
export interface MonthQuestion extends SurveyQuestion {
    monthRange: number;
}
export declare const WhatSymptomsConfig: OptionQuestion;
export declare const SymptomsStartConfig: SurveyQuestion;
export declare const FeverStartConfig: SurveyQuestion;
export declare const CoughStartConfig: SurveyQuestion;
export declare const FatigueStartConfig: SurveyQuestion;
export declare const ChillsStartConfig: SurveyQuestion;
export declare const SoreThroatStartConfig: SurveyQuestion;
export declare const HeadacheStartConfig: SurveyQuestion;
export declare const AchesStartConfig: SurveyQuestion;
export declare const RunningNoseStartConfig: SurveyQuestion;
export declare const ShortBreathStartConfig: SurveyQuestion;
export declare const VomitingStartConfig: SurveyQuestion;
export declare const SymptomsLast48Config: SurveyQuestion;
export declare const FeverLast48Config: SurveyQuestion;
export declare const CoughLast48Config: SurveyQuestion;
export declare const FatigueLast48Config: SurveyQuestion;
export declare const ChillsLast48Config: SurveyQuestion;
export declare const SoreThroatLast48Config: SurveyQuestion;
export declare const HeadacheLast48Config: SurveyQuestion;
export declare const AchesLast48Config: SurveyQuestion;
export declare const RunningNoseLast48Config: SurveyQuestion;
export declare const ShortBreathLast48Config: SurveyQuestion;
export declare const VomitingLast48Config: SurveyQuestion;
export declare const SymptomsSeverityConfig: SurveyQuestion;
export declare const FeverSeverityConfig: SurveyQuestion;
export declare const CoughSeverityConfig: SurveyQuestion;
export declare const FatigueSeverityConfig: SurveyQuestion;
export declare const ChillsSeverityConfig: SurveyQuestion;
export declare const SoreThroatSeverityConfig: SurveyQuestion;
export declare const HeadacheSeverityConfig: SurveyQuestion;
export declare const AchesSeverityConfig: SurveyQuestion;
export declare const RunningNoseSeverityConfig: SurveyQuestion;
export declare const ShortBreathSeverityConfig: SurveyQuestion;
export declare const VomitingSeverityConfig: SurveyQuestion;
export declare const InContactConfig: SurveyQuestion;
export declare const CoughSneezeConfig: SurveyQuestion;
export declare const HouseholdChildrenConfig: SurveyQuestion;
export declare const ChildrenWithChildrenConfig: SurveyQuestion;
export declare const YoungChildrenConfig: SurveyQuestion;
export declare const PeopleInHouseholdConfig: SurveyQuestion;
export declare const BedroomsConfig: SurveyQuestion;
export declare const FluShotConfig: SurveyQuestion;
export declare const FluShotDateConfig: MonthQuestion;
export declare const FluShotNationalImmunization: SurveyQuestion;
export declare const FluShotNationalImmunizationCondition: SurveyQuestion;
export declare const PreviousSeason: SurveyQuestion;
export declare const AssignedSexConfig: SurveyQuestion;
export declare const MedicalConditionConfig: OptionQuestion;
export declare const HealthCareWorkerConfig: SurveyQuestion;
export declare const SmokeTobaccoConfig: SurveyQuestion;
export declare const HouseholdTobaccoConfig: SurveyQuestion;
export declare const InterferingConfig: SurveyQuestion;
export declare const AntibioticsConfig: SurveyQuestion;
export declare const AgeConfig: DropDownQuestion;
export declare const RaceConfig: OptionQuestion;
export declare const BlueLineConfig: SurveyQuestion;
export declare const PinkWhenBlueConfig: SurveyQuestion;
export declare const PinkLineConfig: SurveyQuestion;
export declare const TestFeedbackConfig: SurveyQuestion;
export declare const SURVEY_QUESTIONS: SurveyQuestion[];
