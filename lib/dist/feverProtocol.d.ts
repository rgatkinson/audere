import * as common from "./common";
import { ClientVersionInfo, GpsLocationInfo, SampleInfo, PatientInfoGender, TelecomInfo, TelecomInfoSystem, AddressInfoUse, ConsentInfoSignerType, QuestionInfo, QuestionAnswerOption, OtherValueInfo } from "./common";
export { ClientVersionInfo, GpsLocationInfo, SampleInfo, PatientInfoGender, TelecomInfo, TelecomInfoSystem, AddressInfoUse, ConsentInfoSignerType, QuestionInfo, QuestionAnswerOption, OtherValueInfo };
export interface ProtocolDocumentBase {
    documentType: string;
    schemaId: number;
    csruid: string;
    device: DeviceInfo;
}
export interface DeviceInfo {
    installation: string;
    clientVersion: ClientVersionInfo;
    clientBuild: number;
    yearClass: string;
    idiomText: string;
    platform: string;
}
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
    firstName?: string;
    lastName?: string;
}
export declare enum DocumentType {
    Survey = "SURVEY",
    Feedback = "FEEDBACK",
    Analytics = "ANALYTICS",
    Photo = "PHOTO"
}
export declare type ProtocolDocument = SurveyDocument | FeedbackDocument | AnalyticsDocument | PhotoDocument;
export interface PIIInfo extends CommonInfo {
    gps_location?: GpsLocationInfo;
    patient: PatientInfo;
    consents: ConsentInfo[];
    responses: ResponseInfo[];
}
export interface CommonInfo {
    isDemo: boolean;
    marketingProperties?: any;
    events: EventInfo[];
    pushNotificationState?: PushNotificationState;
    workflow: WorkflowInfo;
}
export interface SurveyDocument extends ProtocolDocumentBase {
    documentType: DocumentType.Survey;
    schemaId: 1;
    survey: SurveyInfo;
}
export declare type SurveyInfo = PIIInfo & SurveyNonPIIInfo;
export interface SurveyNonPIIDbInfo extends SurveyNonPIIInfo {
    consents: NonPIIConsentInfo[];
}
export interface SurveyNonPIIInfo extends CommonInfo {
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
export interface PatientInfo {
    firstName?: string;
    lastName?: string;
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
    localTime?: string;
    appBuild?: string;
}
export interface ConsentInfo extends NonPIIConsentInfo {
    firstName?: string;
    lastName?: string;
    signature?: string;
    relation?: string;
}
export interface WorkflowInfo {
    screeningCompletedAt?: string;
    surveyCompletedAt?: string;
    surveyStartedAt?: string;
    skippedScreeningAt?: string;
    [key: string]: string | undefined;
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
