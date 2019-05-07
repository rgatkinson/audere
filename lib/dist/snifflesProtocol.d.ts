export interface ProtocolDocumentBase {
    documentType: string;
    schemaId: number;
    csruid: string;
    device: DeviceInfo;
}
export declare enum DocumentType {
    Visit = "VISIT",
    Feedback = "FEEDBACK",
    Log = "LOG",
    LogBatch = "LOG_BATCH",
    Backup = "BACKUP"
}
export declare type ProtocolDocument = FeedbackDocument | LogDocument | VisitDocument | LogBatchDocument | BackupDocument;
export interface DeviceInfo {
    installation: string;
    clientVersion: string;
    deviceName: string;
    yearClass: string;
    idiomText: string;
    platform: string;
}
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
export interface GpsLocationInfo {
    latitude: string;
    longitude: string;
}
export interface SampleInfo {
    sample_type: string;
    code: string;
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
    relation?: string;
    localTime?: string;
}
export interface ConsentInfo extends NonPIIConsentInfo {
    name: string;
    signature: string;
}
export declare enum ConsentInfoSignerType {
    Subject = "Subject",
    Parent = "Parent",
    Representative = "Representative",
    Researcher = "Researcher"
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
    name?: string;
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
export interface EventInfo {
    kind: EventInfoKind;
    at: string;
    until?: string;
    refId?: string;
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
