export declare enum DocumentType {
    Visit = "VISIT",
    Feedback = "FEEDBACK",
    Log = "LOG"
}
export declare type VisitDocument = {
    csruid: string;
    documentType: DocumentType.Visit;
    device: DeviceInfo;
    visit: VisitInfo;
};
export declare type DeviceInfo = {
    installation: string;
    clientVersion: string;
    deviceName: string;
    yearClass: string;
    idiomText: string;
    platform: string;
};
export declare type VisitInfo = {
    complete: boolean;
    gps_location?: GpsLocationInfo;
    location?: string;
    samples: SampleInfo[];
    patient: PatientInfo;
    consents: ConsentInfo[];
    responses: ResponseInfo[];
    events: EventInfo[];
};
export declare type GpsLocationInfo = {
    latitude: string;
    longitude: string;
};
export declare type SampleInfo = {
    sample_type: string;
    code: string;
};
export declare type PatientInfo = {
    name?: string;
    birthDate?: string;
    gender?: PatientInfoGender;
    telecom: TelecomInfo[];
    address: AddressInfo[];
};
export declare type PatientInfoGender = "male" | "female" | "other" | "unknown";
export declare type TelecomInfo = {
    system: TelecomInfoSystem;
    value: string;
};
export declare type TelecomInfoSystem = "phone" | "sms" | "email";
export declare type AddressInfo = {
    use: AddressInfoUse;
} & AddressValueInfo;
export declare type AddressInfoUse = "home" | "work";
export declare type ConsentInfo = {
    name: string;
    terms: string;
    signerType: ConsentInfoSignerType;
    date: string;
    signature: string;
};
export declare type ConsentInfoSignerType = "Subject" | "Parent" | "Representative";
export declare type ResponseInfo = {
    id: string;
    item: ResponseItemInfo[];
};
export declare type ResponseItemInfo = QuestionInfo & {
    answer: AnswerInfo[];
};
export declare type QuestionInfo = {
    id: string;
    text: string;
    answerOptions?: QuestionAnswerOption[];
};
export declare type QuestionAnswerOption = {
    id: string;
    text: string;
};
export declare type AnswerInfo = {
    valueBoolean?: boolean;
    valueDateTime?: string;
    valueDecimal?: number;
    valueInteger?: number;
    valueString?: string;
    valueAddress?: AddressValueInfo;
    valueOther?: OtherValueInfo;
    valueDeclined?: boolean;
};
export declare type AddressValueInfo = {
    line: string[];
    city: string;
    state: string;
    postalCode: string;
    country: string;
};
export declare type OtherValueInfo = {
    selectedIndex: Number;
    valueString: string;
};
export declare type EventInfo = {
    kind: EventInfoKind;
    at: string;
    until: string;
    refId?: string;
};
export declare type EventInfoKind = "visit" | "response" | "sample";
