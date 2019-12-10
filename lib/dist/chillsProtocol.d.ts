import * as common from "./common";
import { ClientVersionInfo, SampleInfo, PatientInfoGender, QuestionInfo, QuestionAnswerOption, OtherValueInfo } from "./common";
export { ClientVersionInfo, SampleInfo, PatientInfoGender, QuestionInfo, QuestionAnswerOption, OtherValueInfo, };
export interface ProtocolDocumentBase {
    documentType: string;
    schemaId: number;
    docId: string;
    device: DeviceInfo;
}
export interface DeviceInfo {
    installation: string;
    clientVersion: ClientVersionInfo;
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
    totalTestStripTime?: number;
    captureTime?: number;
    flashEnabled?: boolean;
    rdtTotalTime?: number;
    legacyCameraApi?: boolean;
}
export interface RDTReaderResult {
    testStripDetected: boolean;
    testStripBoundary?: {
        x: number;
        y: number;
    }[];
    skippedDueToMemWarning?: boolean;
    isCentered?: boolean;
    isFocused?: boolean;
    isSteady?: boolean;
    exposureResult?: RDTReaderExposureResult;
    controlLineFound?: boolean;
    testALineFound?: boolean;
    testBLineFound?: boolean;
    intermediateResults?: {
        [key: string]: string;
    };
    phase1Recognitions?: string[];
    phase2Recognitions?: string[];
}
export declare enum RDTReaderExposureResult {
    UNDER_EXPOSED = 0,
    NORMAL = 1,
    OVER_EXPOSED = 2,
    NOT_CALCULATED = 3
}
