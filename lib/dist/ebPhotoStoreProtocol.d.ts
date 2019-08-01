import { ClientVersionInfo } from "./common";
export { ClientVersionInfo };
export interface ProtocolDocumentBase {
    documentType: string;
    schemaId: number;
    docId: string;
    device?: DeviceInfo;
}
export interface DeviceInfo {
    installation: string;
    clientVersion: ClientVersionInfo;
    clientBuild: string;
    idiomText: string;
    platform: object;
}
export declare enum DocumentType {
    Encounter = "ENCOUNTER",
    Triage = "TRIAGE",
    MessagingToken = "MESSAGING_TOKEN",
    Notification = "NOTIFICATION"
}
export declare type ProtocolDocument = EncounterDocument | EncounterTriageDocument;
export declare type TransportMetadata = {
    sentAt: string;
    receivedAt?: string;
    lastWriter: "sender" | "receiver";
    protocolVersion: number;
};
export declare type FirestoreProtocolDocument = ProtocolDocument & {
    _transport: TransportMetadata;
};
export interface EncounterDocument extends ProtocolDocumentBase {
    documentType: DocumentType.Encounter;
    schemaId: 1;
    encounter: EncounterInfo;
}
export interface EncounterInfo {
    isDemo: boolean;
    healthWorker: HealthWorkerInfo;
    localIndex: string;
    patient: PatientInfo;
    rdtPhotos: PhotoInfo[];
    notes: string;
}
export interface HealthWorkerInfo {
    firstName: string;
    lastName: string;
    phone: string;
    notes: string;
}
export interface PatientInfo {
    firstName: string;
    lastName: string;
    phone: string;
    details?: string;
}
export interface PhotoInfo {
    timestamp: string;
    gps: GPSInfo;
    photoId: string;
}
export interface GPSInfo {
    latitude: string;
    longitude: string;
}
export interface PhotoDbInfo extends PhotoInfo {
    jpegBase64: string;
}
export interface Message {
    timestamp: string;
    sender: AuthUser;
    content: string;
}
export interface AuthUser {
    uid: string;
    name: string;
}
export interface Diagnosis {
    tag: ConditionTag;
    value: boolean;
    notes?: string;
    timestamp: string;
    diagnoser: AuthUser;
}
export declare enum ConditionTag {
    Ebola = "EBOLA"
}
export interface EncounterTriageDocument extends ProtocolDocumentBase {
    documentType: DocumentType.Triage;
    schemaId: 1;
    triage: EncounterTriageInfo;
}
export interface EncounterTriageInfo {
    notes: string;
    testIndicatesEVD?: boolean;
    diagnoses?: Diagnosis[];
}
export interface MessagingTokenDocument extends ProtocolDocumentBase {
    documentType: DocumentType.MessagingToken;
    schemaId: 1;
    uid: string;
    phone: string;
    token: string;
}
export interface Notification extends ProtocolDocumentBase {
    documentType: DocumentType.Notification;
    schemaId: 1;
    localIndex: string;
    docId: string;
    notificationType: NotificationType;
}
export declare enum NotificationType {
    Chat = "CHAT",
    Diagnosis = "DIAGNOSIS"
}
export interface NotificationRequest {
    token: string;
    group: string;
    title: string;
    body: string;
    notification: Notification;
}
