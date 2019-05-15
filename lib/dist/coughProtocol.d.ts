import * as common from "./common";
import { DeviceInfo, SampleInfo, PatientInfoGender, QuestionInfo, QuestionAnswerOption, OtherValueInfo } from "./common";
export { DeviceInfo, SampleInfo, PatientInfoGender, QuestionInfo, QuestionAnswerOption, OtherValueInfo };
export interface ProtocolDocumentBase {
    documentType: string;
    schemaId: number;
    docId: string;
    device: DeviceInfo;
}
export interface ResponseInfo {
    id: string;
    item: ResponseItemInfo[];
}
export interface ResponseItemInfo extends QuestionInfo {
    answer: common.AnswerInfo[];
}
export declare enum DocumentType {
    Survey = "SURVEY",
    Analytics = "ANALYTICS",
    Photo = "PHOTO"
}
export declare type ProtocolDocument = SurveyDocument | AnalyticsDocument | PhotoDocument;
export declare type TransportMetadata = {
    sentAt: string;
    receivedAt?: string;
    contentHash: string;
    lastWriter: "sender" | "receiver";
    protocolVersion: number;
};
export declare type FirestoreProtocolDocument = ProtocolDocument & {
    _transport: TransportMetadata;
};
export interface CommonInfo {
    isDemo: boolean;
    marketingProperties?: any;
    events: EventInfo[];
    pushNotificationState?: PushNotificationState;
    workflow: WorkflowInfo;
    gender?: PatientInfoGender;
}
export interface SurveyDocument extends ProtocolDocumentBase {
    documentType: DocumentType.Survey;
    schemaId: 1;
    survey: SurveyInfo;
}
export declare type SurveyInfo = SurveyNonPIIInfo;
export interface SurveyNonPIIInfo extends CommonInfo {
    consents: NonPIIConsentInfo[];
    samples: SampleInfo[];
    invalidBarcodes?: SampleInfo[];
    responses: ResponseInfo[];
}
export interface PushNotificationState {
    showedSystemPrompt: boolean;
    softResponse?: boolean;
    token?: string;
    registrationError?: PushRegistrationError;
}
export interface PushRegistrationError {
    message: string;
    code: number;
    details: string;
}
export interface NonPIIConsentInfo {
    terms: string;
    date: string;
    localTime?: string;
}
export interface WorkflowInfo {
    screeningCompletedAt?: string;
    surveyCompletedAt?: string;
    surveyStartedAt?: string;
    skippedScreeningAt?: string;
    [key: string]: string | undefined;
}
export interface AnalyticsDocument extends ProtocolDocumentBase {
    documentType: DocumentType.Analytics;
    schemaId: 1;
    analytics: AnalyticsInfo;
}
export interface AnalyticsInfo {
    timestamp: string;
    logs: LogRecordInfo[];
    events: EventInfo[];
    crash?: string;
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
export interface PhotoDocument extends ProtocolDocumentBase {
    documentType: DocumentType.Photo;
    schemaId: 1;
    photo: PhotoInfo;
}
export interface PhotoInfo {
    timestamp: string;
    jpegBase64: string;
}
export interface EventInfo extends common.EventInfo {
    kind: EventInfoKind;
}
export declare enum EventInfoKind {
    Response = "response",
    Sample = "sample",
    Screening = "screening",
    Survey = "survey",
    AppNav = "appNav",
    TimeoutNav = "timeoutNav",
    Interaction = "interaction",
    Render = "render"
}
