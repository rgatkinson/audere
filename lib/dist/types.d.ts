export interface ProtocolDocumentBase {
    documentType: string;
    schemaId: number;
    csruid: string;
    device: DeviceInfo;
}
export declare enum DocumentType {
    Visit = "VISIT",
    VisitCore = "VISIT_CORE",
    VisitIdentity = "VISIT_IDENTITY",
    Feedback = "FEEDBACK",
    Log = "LOG"
}
export declare type ProtocolDocument = FeedbackDocument | LogDocument | VisitDocument;
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
export interface VisitCoreDocument extends ProtocolDocumentBase {
    documentType: DocumentType.VisitCore;
    schemaId: 1;
    visit: VisitCoreInfo;
}
export interface VisitIdentityDocument extends ProtocolDocumentBase {
    documentType: DocumentType.VisitIdentity;
    schemaId: 1;
    visit: VisitIdentityInfo;
}
export declare type VisitInfo = VisitCoreInfo & VisitIdentityInfo;
export interface VisitCoreInfo extends VisitCommonInfo {
    samples: SampleInfo[];
    giftcards: GiftCardInfo[];
    responses: ResponseInfo[];
}
export interface VisitIdentityInfo extends VisitCommonInfo {
    gps_location?: GpsLocationInfo;
    patient: PatientInfo;
    consents: ConsentInfo[];
    responses: ResponseInfo[];
}
export interface VisitCommonInfo {
    complete: boolean;
    location?: string;
    administrator?: string;
    events: EventInfo[];
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
    Work = "work"
}
export interface ConsentInfo {
    name: string;
    terms: string;
    signerType: ConsentInfoSignerType;
    date: string;
    signature: string;
    relation?: string;
}
export declare enum ConsentInfoSignerType {
    Subject = "Subject",
    Parent = "Parent",
    Representative = "Representative"
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
    valueOther?: OtherValueInfo;
    valueDeclined?: boolean;
}
export interface AddressValueInfo {
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
export interface LogInfo {
    logentry: string;
}
