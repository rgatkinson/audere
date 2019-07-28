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
    Triage = "TRIAGE"
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
export interface EncounterTriageDocument extends ProtocolDocumentBase {
    documentType: DocumentType.Triage;
    schemaId: 1;
    triage: EncounterTriageInfo;
}
export interface EncounterTriageInfo {
    notes: string;
    testIndicatesEVD: boolean;
}
