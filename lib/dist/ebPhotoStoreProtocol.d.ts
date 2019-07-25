import { ClientVersionInfo, SampleInfo } from "./common";
export { ClientVersionInfo, SampleInfo };
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
export declare enum DocumentType {
    Patient = "PATIENT",
    Photo = "PHOTO"
}
export declare type ProtocolDocument = PatientDocument | PhotoDocument;
export declare type TransportMetadata = {
    sentAt: string;
    receivedAt?: string;
    lastWriter: "sender" | "receiver";
    protocolVersion: number;
};
export declare type FirestoreProtocolDocument = ProtocolDocument & {
    _transport: TransportMetadata;
};
export interface PatientDocument extends ProtocolDocumentBase {
    documentType: DocumentType.Patient;
    schemaId: 1;
    patient: PatientInfo;
}
export interface PatientInfo {
    isDemo: boolean;
    firstName?: string;
    lastName?: string;
    phone?: string;
    details?: string;
    notes: string;
    samples: SampleInfo[];
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
