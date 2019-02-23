export interface ProtocolDocumentBase {
    documentType: string;
    schemaId: number;
    csruid: string;
    device: DeviceInfo;
}
export declare enum DocumentType {
    Survey = "SURVEY",
    Feedback = "FEEDBACK",
    Analytics = "ANALYTICS",
    Photo = "PHOTO"
}
export declare type ProtocolDocument = SurveyDocument | FeedbackDocument | AnalyticsDocument | PhotoDocument;
export interface DeviceInfo {
    installation: string;
    clientVersion: string;
    yearClass: string;
    idiomText: string;
    platform: string;
}
export interface PIIInfo extends CommonInfo {
    gps_location?: GpsLocationInfo;
    patient: PatientInfo;
    consents: ConsentInfo[];
    responses: ResponseInfo[];
}
export interface CommonInfo {
    isDemo: boolean;
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
    responses: ResponseInfo[];
}
export interface GpsLocationInfo {
    latitude: string;
    longitude: string;
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
export interface SampleInfo {
    sample_type: string;
    code: string;
}
export interface PatientInfo {
    name?: string;
    birthDate?: string;
    gender?: PatientInfoGender;
    telecom: TelecomInfo[];
    address: AddressInfo[];
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
export interface AddressInfo extends AddressValueInfo {
    use: AddressInfoUse;
}
export declare enum AddressInfoUse {
    Home = "home",
    Work = "work",
    Temp = "temp"
}
export interface NonPIIConsentInfo {
    terms: string;
    signerType: ConsentInfoSignerType;
    date: string;
    localTime?: string;
}
export interface ConsentInfo extends NonPIIConsentInfo {
    name?: string;
    signature?: string;
    relation?: string;
}
export declare enum ConsentInfoSignerType {
    Subject = "Subject",
    Parent = "Parent",
    Representative = "Representative",
    Researcher = "Researcher"
}
export interface WorkflowInfo {
    screeningComplete: boolean;
    surveyComplete: boolean;
    surveyStarted: boolean;
}
export interface ResponseInfo {
    id: string;
    item: ResponseItemInfo[];
}
export interface ResponseItemInfo extends QuestionInfo {
    answer: AnswerInfo[];
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
export interface AnswerInfo {
    valueBoolean?: boolean;
    valueDateTime?: string;
    valueDecimal?: number;
    valueInteger?: number;
    valueString?: string;
    valueAddress?: AddressValueInfo;
    valueIndex?: number;
    valueOther?: OtherValueInfo;
    valueDeclined?: boolean;
}
export interface AddressValueInfo {
    name: string;
    line: string[];
    city: string;
    state: string;
    postalCode: string;
    country: string;
}
export interface OtherValueInfo {
    selectedIndex: Number;
    valueString: string;
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
export interface EventInfo {
    kind: EventInfoKind;
    at: string;
    until?: string;
    refId?: string;
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
