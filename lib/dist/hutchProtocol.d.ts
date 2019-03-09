export declare const schemaVersion: string;
export interface Encounter {
    id: string;
    participant: string;
    schemaVersion: string;
    revision: string;
    localeLanguageCode: "en" | "es";
    startTimestamp: string;
    site?: string;
    locations: Location[];
    sampleCodes: SampleCode[];
    responses: Response[];
    age?: Age;
}
export interface Age {
    value?: number;
    ninetyOrAbove: boolean;
}
export declare enum LocationType {
    Home = "Home",
    Work = "Work",
    Temp = "Temp"
}
export interface Location {
    use: LocationType;
    id: string;
    region: string;
}
export declare enum SampleType {
    SelfSwab = "SelfSwab",
    ClinicSwab = "ClinicSwab",
    Blood = "Blood",
    Serum = "Serum",
    PBMC = "PBMC"
}
export interface SampleCode {
    type: SampleType;
    code: string;
}
export interface Response {
    question: LocalText;
    options?: LocalText[];
    answer: Answer;
}
export declare type Answer = StringAnswer | NumberAnswer | OptionAnswer | DeclinedToAnswer;
export interface StringAnswer {
    type: "String";
    value: string;
}
export interface NumberAnswer {
    type: "Number";
    value: number;
}
export interface OptionAnswer {
    type: "Option";
    chosenOptions: number[];
}
export interface DeclinedToAnswer {
    type: "Declined";
}
export interface LocalText {
    token: string;
    text: string;
}
