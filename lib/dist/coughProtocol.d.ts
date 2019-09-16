import * as common from "./common";
import { ClientVersionInfo, SampleInfo, PatientInfoGender, QuestionInfo, QuestionAnswerOption, OtherValueInfo } from "./common";
export { ClientVersionInfo, SampleInfo, PatientInfoGender, QuestionInfo, QuestionAnswerOption, OtherValueInfo, };
export interface ProtocolDocumentBase {
    documentType: string;
    schemaId: number;
    docId: string;
    device: DeviceInfo;
}
interface RDTVersionInfo {
    rdtVersionAndroid?: string;
    rdtVersionIos?: string;
}
export interface DeviceInfo {
    installation: string;
    clientVersion: ClientVersionInfo & RDTVersionInfo;
    clientBuild: number;
    yearClass: string;
    idiomText: string;
    platform: object;
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
    Photo = "PHOTO"
}
export declare type ProtocolDocument = SurveyDocument | PhotoDocument;
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
    rdtInfo?: RDTInfo;
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
export interface PhotoDocument extends ProtocolDocumentBase {
    documentType: DocumentType.Photo;
    schemaId: 1;
    photo: PhotoInfo;
}
export interface PhotoInfo {
    timestamp: string;
    photoId: string;
}
export interface PhotoDbInfo extends PhotoInfo {
    jpegBase64: string;
}
export interface EventInfo extends common.EventInfo {
    kind: EventInfoKind;
}
export declare enum EventInfoKind {
    AppNav = "appNav",
    TimeoutNav = "timeoutNav",
    Render = "render"
}
export interface RDTInfo {
    rdtReaderResult?: RDTReaderResult;
    interpreter?: string;
    totalTestStripTime?: number;
    captureTime?: number;
    flashEnabled?: boolean;
    flashDisabledAutomatically?: boolean;
    rdtTotalTime?: number;
    resultShown?: string;
    resultShownExplanation?: string;
}
export interface RDTReaderResult {
    testStripFound: boolean;
    testStripBoundary?: {
        x: number;
        y: number;
    }[];
    skippedDueToMemWarning?: boolean;
    isCentered?: boolean;
    sizeResult?: RDTReaderSizeResult;
    isFocused?: boolean;
    angle?: number;
    isRightOrientation?: boolean;
    exposureResult?: RDTReaderExposureResult;
    controlLineFound?: boolean;
    testALineFound?: boolean;
    testBLineFound?: boolean;
}
export declare enum RDTReaderExposureResult {
    UNDER_EXPOSED = 0,
    NORMAL = 1,
    OVER_EXPOSED = 2
}
export declare enum RDTReaderSizeResult {
    RIGHT_SIZE = 0,
    LARGE = 1,
    SMALL = 2,
    INVALID = 3
}
export interface GiftcardRequest {
    docId: string;
    barcode: string;
    denomination: number;
    isDemo: boolean;
    secret: string;
}
export interface GiftcardResponse {
    giftcard?: Giftcard;
    failureReason?: GiftcardFailureReason;
}
export interface GiftcardAvailabilityResponse {
    giftcardAvailable: boolean;
    failureReason?: GiftcardFailureReason;
}
interface Giftcard {
    url: string;
    denomination: number;
    isDemo: boolean;
    isNew: boolean;
}
export declare enum GiftcardFailureReason {
    CARDS_EXHAUSTED = 0,
    INVALID_DOC_ID = 1,
    INVALID_BARCODE = 2,
    API_ERROR = 3
}
