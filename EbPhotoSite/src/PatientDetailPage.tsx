// Copyright (c) 2019 by Audere
//
// Use of this source code is governed by an MIT-style license that
// can be found in the LICENSE file distributed with this file.

import React, { ChangeEvent } from "react";
import { RouteComponentProps, withRouter } from "react-router-dom";
import ExifOrientationImg from "react-exif-orientation-img";
import deepEqual from "deep-equal";

import {
  Diagnosis,
  DocumentType,
  EncounterDocument,
  EncounterTriageDocument,
  EncounterTriageInfo,
  ConditionTag,
  Message,
  NotificationType,
  Notification,
  PhotoInfo,
} from "audere-lib/dist/ebPhotoStoreProtocol";
import { getApi, getAuthUser, FirebaseUnsubscriber } from "./api";
import {
  last,
  localeDate,
  triageDocFromTriage,
  retryWithBackoff,
} from "./util";
import { Chat } from "./Chat";
import "./PatientDetailPage.css";
import { SimpleMap } from "./SimpleMap";
import { getLocation, MarkerStatus } from "./EncounterMap";

type TextAreaChangeEvent = ChangeEvent<HTMLTextAreaElement>;

export interface PatientDetailMatchParams {
  docId: string;
}

export interface PatientDetailPageProps
  extends RouteComponentProps<PatientDetailMatchParams> {}

export interface PatientDetailPageState {
  eDoc: EncounterDocument | null;
  tDoc: EncounterTriageDocument | null;
  messages: Message[];
  error?: string;
  savedTriage: EncounterTriageInfo | null;
}

class PatientDetailPageAssumeRouter extends React.Component<
  PatientDetailPageProps,
  PatientDetailPageState
> {
  _unsubEncounter: FirebaseUnsubscriber | null = null;
  _unsubTriage: FirebaseUnsubscriber | null = null;
  _unsubMessage: FirebaseUnsubscriber | null = null;

  constructor(props: PatientDetailPageProps) {
    super(props);
    this.state = {
      eDoc: null,
      tDoc: null,
      messages: [],
      savedTriage: null,
    };
  }

  componentDidMount() {
    this.load();
  }

  componentWillUnmount() {
    this._unsubEncounter && this._unsubEncounter();
    this._unsubTriage && this._unsubTriage();
    this._unsubMessage && this._unsubMessage();
  }

  private load = async (): Promise<void> => {
    const { docId } = this.props.match.params;
    const api = getApi();

    // TODO: show errors
    {
      const [eSnap, tSnap] = await Promise.all([
        api.loadEncounter(docId),
        api.loadTriage(docId),
      ]);
      const eDoc = eSnap ? (eSnap.data() as EncounterDocument) : null;
      const tDoc = tSnap ? (tSnap.data() as EncounterTriageDocument) : null;
      const savedTriage = tDoc ? tDoc.triage : null;
      this.setState({ eDoc, tDoc, savedTriage });
    }

    this.updateSeenEncounterTimestamp();
    this._unsubEncounter = api.listenForEncounter(docId, eDoc => {
      this.setState({ eDoc });
      this.updateSeenEncounterTimestamp();
    });
    this._unsubTriage = api.listenForTriage(docId, tDoc =>
      this.setState({ tDoc })
    );
    this._unsubMessage = api.listenForMessages(docId, messages =>
      this.setState({ messages })
    );
  };

  currentTriage(): EncounterTriageInfo {
    const { eDoc, tDoc } = this.state;
    return tDoc
      ? tDoc.triage
      : {
          notes: "",
          diagnoses: [],
          seenEncounterTimestamp: eDoc ? eDoc.encounter.updatedAt : "",
          seenMessageTimestamp: "",
        };
  }

  changeEVD = async (testIndicatesEVD: boolean) => {
    const authUser = await getAuthUser();
    const diagnoses = [
      ...(this.currentTriage().diagnoses || []),
      {
        tag: ConditionTag.Ebola,
        value: testIndicatesEVD,
        diagnoser: authUser,
        timestamp: new Date().toISOString(),
      },
    ];
    this.changeTriage({ diagnoses });
  };

  changeNotes = (notes: string) => {
    this.changeTriage({ notes });
  };

  updateSeenMessageTimestamp = () => {
    const { messages } = this.state;
    if (messages.length > 0) {
      const last = messages[messages.length - 1];
      const seenMessageTimestamp = last.timestamp;
      this.changeTriage({ seenMessageTimestamp });
    }
  };

  updateSeenEncounterTimestamp = () => {
    const { eDoc } = this.state;
    if (eDoc) {
      const seenEncounterTimestamp = eDoc.encounter.updatedAt;
      this.changeTriage({ seenEncounterTimestamp });
    }
  };

  changeTriage(update: object) {
    this.save({ ...this.currentTriage(), ...update });
  }

  save = async (triage: EncounterTriageInfo) => {
    const { savedTriage } = this.state;
    if (this.state.eDoc && !deepEqual(triage, savedTriage)) {
      const { docId } = this.state.eDoc;
      try {
        const updated = triageDocFromTriage(docId, triage);
        await getApi().saveTriage(updated);
        await this.triageChangeHandler(updated);
      } catch (err) {}
    }
  };

  triageChangeHandler = async (
    tDoc: EncounterTriageDocument
  ): Promise<void> => {
    if (this.state.eDoc != null) {
      const api = getApi();
      const { eDoc } = this.state;
      const phone = eDoc.encounter.healthWorker.phone;

      console.log(`Triage status changed for document ${eDoc.docId}`);

      const doc = await api.getRegistrationToken(phone);

      if (doc != null && doc.token != null) {
        const details: Notification = {
          documentType: DocumentType.Notification,
          schemaId: 1,
          localIndex: eDoc.encounter.localIndex,
          docId: eDoc.docId,
          notificationType: NotificationType.Diagnosis,
        };

        await api.pushNotification(
          doc.token,
          "Updated EVD diagnosis",
          "A patient's test result interpretation is available",
          details,
          "triage_evd"
        );
      } else {
        console.warn(
          `No registration token found for phone number ${phone}, ` +
            `no notification of triage will be sent`
        );
      }
    }

    this.setState({ tDoc });
  };

  public render(): React.ReactNode {
    const { eDoc: encounter, tDoc: triage, messages } = this.state;
    return (
      <div className="PatientDetailPage">
        {encounter == null ? (
          <div>Loading...</div>
        ) : (
          <div>
            <PatientInfoPane eDoc={encounter} tDoc={triage} />
            <TestDetailPane eDoc={encounter} tDoc={triage} />
            <TriagePane
              eDoc={encounter}
              tDoc={triage}
              key={JSON.stringify(triage)}
              reload={this.load}
              triageChangedAction={this.triageChangeHandler}
              changeEVD={this.changeEVD}
              changeNotes={this.changeNotes}
              error={this.state.error}
            />
            <PhotoPane eDoc={encounter} tDoc={triage} />
            <Chat
              localIndex={encounter.encounter.localIndex}
              parentDocId={encounter.docId}
              phone={encounter.encounter.healthWorker.phone}
              chwUid={encounter.encounter.healthWorker.uid}
              messages={messages}
              lastSeenTimestamp={
                (triage && triage.triage.seenMessageTimestamp) || ""
              }
              onSawLatest={this.updateSeenMessageTimestamp}
            />
          </div>
        )}
      </div>
    );
  }
}
export const PatientDetailPage = withRouter(PatientDetailPageAssumeRouter);

interface PatientInfoPaneProps {
  eDoc: EncounterDocument;
  tDoc: EncounterTriageDocument | null;
}

class PatientInfoPane extends React.Component<PatientInfoPaneProps> {
  private renderDiagnosisBubble(diagnosis: Diagnosis) {
    const { value: evdPositive, diagnoser, timestamp } = diagnosis;
    const className = evdPositive ? "Positive" : "Negative";
    const message = evdPositive
      ? "*Likely POSITIVE for Ebola"
      : "*Likely NEGATIVE for Ebola";
    return (
      <div className={`DiagnosisBubble ${className}`}>
        <div className={`Message ${className}`}>{message}</div>
        <div className="Details">
          <div className="Detail">
            Reviewed by: <strong>{diagnoser.name}</strong>
          </div>
          <div className="Detail">
            Date: <strong>{localeDate(timestamp)}</strong>
          </div>
        </div>
      </div>
    );
  }
  public render(): React.ReactNode {
    const { localIndex, patient, notes } = this.props.eDoc.encounter;
    const triaged =
      this.props.tDoc &&
      this.props.tDoc.triage.diagnoses &&
      this.props.tDoc.triage.diagnoses.length > 0;
    const diagnosis = triaged && last(this.props.tDoc!.triage.diagnoses!);
    return (
      <div className="PatientInfoPane">
        <div className="PatientInfoHeader">
          <h2>
            {patient.firstName} {patient.lastName} (ID: {localIndex})
          </h2>
          {diagnosis && this.renderDiagnosisBubble(diagnosis)}
        </div>
        <div>
          <a className="PatientListLink" href={`/patients/`}>
            ← Back to Patient List
          </a>
        </div>
        <h3>Patient Information</h3>
        <table className="DetailTable">
          <thead>
            <tr className="Header">
              <td>Phone</td>
              <td>Contact Details</td>
              <td>CHW Notes</td>
              <td />
            </tr>
          </thead>
          <tbody>
            <tr className="Content">
              <td>{patient.phone}</td>
              <td>{patient.details}</td>
              <td>{notes}</td>
              <td />
            </tr>
          </tbody>
        </table>
      </div>
    );
  }
}

class TestDetailPane extends React.Component<PatientInfoPaneProps> {
  public render() {
    const { encounter } = this.props.eDoc;
    const photo = last(encounter.rdtPhotos);
    const timestamp = photo ? localeDate(photo.timestamp) : "Not Tested";
    const chwName =
      encounter.healthWorker.firstName + " " + encounter.healthWorker.lastName;
    const { phone, notes } = encounter.healthWorker;

    return (
      <div>
        <h3>Patient Test Detail</h3>
        <table className="DetailTable">
          <thead>
            <tr className="Header">
              <td>Tested on</td>
              <td>Tested by</td>
              <td>Contact info</td>
              <td>About this CHW</td>
            </tr>
          </thead>
          <tbody>
            <tr className="Content">
              <td>{timestamp}</td>
              <td>{chwName}</td>
              <td>{phone}</td>
              <td>{notes}</td>
            </tr>
          </tbody>
        </table>
      </div>
    );
  }
}

interface TriageProps extends PatientInfoPaneProps {
  reload: () => Promise<void>;
  triageChangedAction: (tDoc: EncounterTriageDocument) => Promise<void>;
  error?: string;
  changeEVD: (evdStatus: boolean) => void;
  changeNotes: (notes: string) => void;
}

interface TriageState {
  busy: boolean;
  noteChanged: boolean;
  notes?: string;
}

class TriagePane extends React.Component<TriageProps, TriageState> {
  constructor(props: TriageProps) {
    super(props);
    this.state = {
      busy: false,
      noteChanged: false,
    };
  }

  onEVDYes = () => this.props.changeEVD(true);
  onEVDNo = () => this.props.changeEVD(false);

  onNotesChange = (e: TextAreaChangeEvent) =>
    this.setState({
      notes: e.target.value,
      noteChanged: true,
    });

  onNotesSave = () => {
    this.props.changeNotes(this.state.notes || "");
    this.setState({ noteChanged: false });
  };

  public render(): React.ReactNode {
    const { busy, noteChanged } = this.state;
    const { error } = this.props;
    const triage = this.props.tDoc && this.props.tDoc.triage;
    const diagnosis =
      triage &&
      triage.diagnoses &&
      triage.diagnoses.length >= 1 &&
      triage.diagnoses[triage.diagnoses.length - 1];
    const notes =
      this.state.notes !== undefined
        ? this.state.notes
        : triage && triage.notes;
    return (
      <div className="TriagePane">
        <h3>Does the below image indicate EVD positivity?</h3>
        <div className="EditDetail">
          <input
            type="button"
            value="YES"
            name="NAME-test-indicates-evd-yes"
            className={
              diagnosis && diagnosis.value ? "evdPressed" : "evdUnpressed"
            }
            disabled={busy}
            onClick={this.onEVDYes}
          />
          <input
            type="button"
            value="NO"
            name="NAME-test-indicates-evd-no"
            className={
              diagnosis && !diagnosis.value ? "evdPressed" : "evdUnpressed"
            }
            disabled={busy}
            onClick={this.onEVDNo}
          />
        </div>
        <div className="triageNotes">
          <textarea
            id="notes"
            disabled={busy}
            value={notes || ""}
            onChange={this.onNotesChange}
            placeholder={"Add additional triage notes here"}
          />
          <input
            type="button"
            value="SAVE"
            className={noteChanged && !busy ? "evdPressed" : "evdUnpressed"}
            disabled={busy || !noteChanged}
            onClick={this.onNotesSave}
          />
        </div>
        {error != null && <div className="Error">{error}</div>}
      </div>
    );
  }
}

interface PhotoPaneState {
  urls: { [photoId: string]: PhotoFetchResult };
}

interface PhotoFetchResult {
  url?: string;
  error?: Error;
}

class PhotoPane extends React.Component<PatientInfoPaneProps, PhotoPaneState> {
  state: PhotoPaneState = { urls: {} };

  componentWillReceiveProps(nextProps: PatientInfoPaneProps) {
    nextProps.eDoc.encounter.rdtPhotos.map(photo =>
      this.loadUrl(photo.photoId)
    );
  }

  private async loadUrl(photoId: string): Promise<void> {
    if (this.state.urls[photoId]) {
      return;
    }
    this.setState(state => ({
      urls: {
        ...state.urls,
        [photoId]: {},
      },
    }));
    retryWithBackoff(async () => {
      try {
        const url = await getApi().photoUrl(photoId);
        this.setState(state => ({
          urls: {
            ...state.urls,
            [photoId]: { url },
          },
        }));
        return true;
      } catch (error) {
        console.warn(error);
        return false;
      }
    });
  }

  public renderPhoto = (photo: PhotoInfo, index = -1) => {
    const { urls } = this.state;
    const { url, error } =
      urls[photo.photoId] ||
      ({ error: new Error(JSON.stringify(urls)) } as PhotoFetchResult);
    return (
      <div className="PhotoPane" key={index}>
        <table>
          <tbody>
            <tr>
              <td>
                {url != null && (
                  <div
                    style={{
                      backgroundColor: "gray",
                      marginRight: "1rem",
                      marginBottom: "0.5rem",
                    }}
                  >
                    <ExifOrientationImg
                      src={url}
                      alt="RDT Result"
                      style={{
                        width: "400px",
                        height: "400px",
                        objectFit: "contain",
                      }}
                    />
                  </div>
                )}
                {index !== -1 && (
                  <table>
                    <thead>
                      <tr>
                        <th>Taken on:</th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr>
                        <td>{localeDate(photo.timestamp)}</td>
                      </tr>
                    </tbody>
                  </table>
                )}
              </td>
              <td>
                <SimpleMap
                  locations={[
                    getLocation(
                      this.props.eDoc,
                      MarkerStatus.EVD_UNTRIAGED,
                      photo
                    ),
                  ]}
                  style={{
                    height: "400px",
                    width: "400px",
                    marginBottom: "0.5rem",
                  }}
                  zoom={11}
                />
                <table>
                  <thead>
                    <tr>
                      <th>Test Location:</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr>
                      <td>
                        {parseFloat(photo.gps.latitude).toFixed(6)},{" "}
                        {parseFloat(photo.gps.longitude).toFixed(6)}
                      </td>
                    </tr>
                  </tbody>
                </table>
              </td>
            </tr>
          </tbody>
        </table>
        {error != null && <div>ERROR: {error.message}</div>}
      </div>
    );
  };

  public render(): React.ReactNode {
    const { rdtPhotos } = this.props.eDoc.encounter;
    const photo = last(rdtPhotos);
    if (!photo) {
      return null;
    }
    return (
      <div>
        {this.renderPhoto(photo)}
        {rdtPhotos.length > 1 && (
          <details>
            <summary>
              Show previous {rdtPhotos.length > 2 ? "photos" : "photo"}
            </summary>
            {rdtPhotos.slice(0, -1).map(this.renderPhoto)}
          </details>
        )}
      </div>
    );
  }
}
