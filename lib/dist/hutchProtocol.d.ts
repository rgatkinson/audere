import { LocationType } from "./locations";
export declare const schemaVersion: string;
export interface Encounter {
    id: string;
    participant: string;
    schemaVersion: string;
    revision: string;
    localeLanguageCode: "en" | "es";
    startTimestamp: string;
    site?: Site;
    locations: Location[];
    sampleCodes: SampleCode[];
    responses: Response[];
    events: Event[];
    age?: Age;
}
export interface Age {
    value?: number;
    ninetyOrAbove: boolean;
}
export interface Event {
    time: string;
    eventType: EventType;
}
export declare enum EventType {
    BarcodeScanned = "BarcodeScanned",
    ConsentSigned = "ConsentSigned",
    StartedQuestionnaire = "StartedQuestionnaire",
    SymptomsScreened = "SymptomsScreened"
}
export declare enum LocationUse {
    Home = "Home",
    Work = "Work",
    Temp = "Temp"
}
export interface Site {
    type: LocationType;
    name: string;
}
export interface Location {
    use: LocationUse;
    id: string;
    region: string;
    city: string;
    state: string;
}
export declare enum SampleType {
    StripPhoto = "StripPhoto",
    ManualSelfSwab = "ManualSelfSwab",
    ScannedSelfSwab = "ScannedSelfSwab",
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
