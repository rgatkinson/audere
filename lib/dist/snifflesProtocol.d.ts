import * as common from "./common";
export import ProtocolDocumentBase = common.ProtocolDocumentBase;
export import DeviceInfo = common.DeviceInfo;
export import GpsLocationInfo = common.GpsLocationInfo;
export import SampleInfo = common.SampleInfo;
export import PatientInfoGender = common.PatientInfoGender;
export import TelecomInfo = common.TelecomInfo;
export import TelecomInfoSystem = common.TelecomInfoSystem;
export import AddressInfoUse = common.AddressInfoUse;
export import ConsentInfoSignerType = common.ConsentInfoSignerType;
export import QuestionInfo = common.QuestionInfo;
export import QuestionAnswerOption = common.QuestionAnswerOption;
export interface ResponseInfo {
    id: string;
    item: ResponseItemInfo[];
}
export interface ResponseItemInfo extends QuestionInfo {
    answer: AnswerInfo[];
}
export interface AnswerInfo extends common.AnswerInfo {
    valueAddress?: AddressValueInfo;
}
export interface AddressValueInfo extends common.AddressInfo {
    name?: string;
}
export import OtherValueInfo = common.OtherValueInfo;
export declare enum DocumentType {
    Visit = "VISIT",
    Feedback = "FEEDBACK",
    Log = "LOG",
    LogBatch = "LOG_BATCH",
    Backup = "BACKUP"
}
export declare type ProtocolDocument = FeedbackDocument | LogDocument | VisitDocument | LogBatchDocument | BackupDocument;
export interface VisitDocument extends ProtocolDocumentBase {
    documentType: DocumentType.Visit;
    schemaId: 1;
    visit: VisitInfo;
}
export declare type VisitInfo = VisitPIIInfo & VisitNonPIIInfo;
export interface VisitPIIInfo extends VisitCommonInfo {
    gps_location?: GpsLocationInfo;
    patient: PatientInfo;
    consents: ConsentInfo[];
    responses: ResponseInfo[];
}
export interface VisitNonPIIDbInfo extends VisitNonPIIInfo {
    consents: NonPIIConsentInfo[];
}
export interface VisitNonPIIInfo extends VisitCommonInfo {
    samples: SampleInfo[];
    giftcards: GiftCardInfo[];
    responses: ResponseInfo[];
}
export interface VisitCommonInfo {
    complete: boolean;
    isDemo?: boolean;
    location?: string;
    administrator?: string;
    events: EventInfo[];
    localUid?: string;
}
export interface GiftCardInfo {
    barcodeType: string;
    code: string;
    giftcardType: string;
}
export interface PatientInfo {
    name?: string;
    birthDate?: string;
    gender?: PatientInfoGender;
    telecom: TelecomInfo[];
    address: AddressInfo[];
}
export interface AddressInfo extends AddressValueInfo {
    use: AddressInfoUse;
}
export interface NonPIIConsentInfo {
    terms: string;
    signerType: ConsentInfoSignerType;
    date: string;
    relation?: string;
    localTime?: string;
}
export interface ConsentInfo extends NonPIIConsentInfo {
    name: string;
    signature: string;
}
export interface EventInfo extends common.EventInfo {
    kind: EventInfoKind;
}
export declare enum EventInfoKind {
    Visit = "visit",
    Response = "response",
    Sample = "sample"
}
export interface FeedbackDocument extends ProtocolDocumentBase {
    documentType: DocumentType.Feedback;
    schemaId: 1;
    feedback: FeedbackInfo;
}
export interface FeedbackInfo {
    subject: string;
    body: string;
}
export interface LogDocument extends ProtocolDocumentBase {
    documentType: DocumentType.Log;
    schemaId: 1;
    log: LogInfo;
}
export declare enum LogLevel {
    Info = 1,
    Warn = 2,
    Error = 3,
    Fatal = 4
}
export interface LogInfo {
    logentry: string;
    level: LogLevel;
}
export interface LogBatchDocument extends ProtocolDocumentBase {
    documentType: DocumentType.LogBatch;
    schemaId: 1;
    batch: LogBatchInfo;
}
export interface LogBatchInfo {
    timestamp: string;
    records: LogRecordInfo[];
}
export interface LogRecordInfo {
    timestamp: string;
    level: LogRecordLevel;
    text: string;
}
export declare enum LogRecordLevel {
    Debug = "DEBUG",
    Info = "INFO",
    Warn = "WARN",
    Error = "ERROR",
    Fatal = "FATAL"
}
export interface BackupDocument extends ProtocolDocumentBase {
    documentType: DocumentType.Backup;
    schemaId: 1;
    visit: VisitInfo;
}
