export interface ProtocolDocumentBase {
    documentType: string;
    schemaId: number;
    csruid: string;
    device: DeviceInfo;
}
export interface DeviceInfo {
    installation: string;
    clientVersion: ClientVersionInfo;
    clientBuild?: number;
    deviceName?: string;
    yearClass: string;
    idiomText: string;
    platform: object;
}
export interface ClientVersionInfo {
    buildDate: string;
    hash: string;
    name: string;
    version: string;
}
export interface GpsLocationInfo {
    latitude: string;
    longitude: string;
}
export interface EventInfo {
    at: string;
    until?: string;
    refId?: string;
}
export interface SampleInfo {
    sample_type: string;
    code: string;
}
export declare enum PatientInfoGender {
    Male = "male",
    Female = "female",
    Other = "other",
    Unknown = "unknown"
}
export interface TelecomInfo {
    system: TelecomInfoSystem;
    value: string;
}
export declare enum TelecomInfoSystem {
    Phone = "phone",
    SMS = "sms",
    Email = "email"
}
export declare enum AddressInfoUse {
    Home = "home",
    Work = "work",
    Temp = "temp"
}
export interface AddressInfo {
    line: string[];
    city: string;
    state: string;
    postalCode: string;
    country: string;
}
export declare enum ConsentInfoSignerType {
    Subject = "Subject",
    Parent = "Parent",
    Representative = "Representative",
    Researcher = "Researcher"
}
export interface QuestionInfo {
    id: string;
    text: string;
    answerOptions?: QuestionAnswerOption[];
}
export interface QuestionAnswerOption {
    id: string;
    text: string;
}
export interface ResponseInfo {
    id: string;
    item: ResponseItemInfo[];
}
export interface ResponseItemInfo extends QuestionInfo {
    answer: AnswerInfo[];
}
export interface AnswerValueInfo extends AnswerInfo {
    valueAddress?: AddressInfo;
}
export interface AnswerInfo {
    valueBoolean?: boolean;
    valueDateTime?: string;
    valueDecimal?: number;
    valueInteger?: number;
    valueString?: string;
    valueIndex?: number;
    valueOther?: OtherValueInfo;
    valueDeclined?: boolean;
}
export interface OtherValueInfo {
    selectedIndex: Number;
    valueString: string;
}
