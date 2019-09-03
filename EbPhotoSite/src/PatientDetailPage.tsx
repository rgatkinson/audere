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
import Chat from "./Chat";
import "./PatientDetailPage.css";
import { getLocation, MarkerStatus } from "./EncounterMap";
import SimpleMap from "./SimpleMap";
import { WithNamespaces, withNamespaces } from "react-i18next";

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
  PatientDetailPageProps & WithNamespaces,
  PatientDetailPageState
> {
  _unsubEncounter: FirebaseUnsubscriber | null = null;
  _unsubTriage: FirebaseUnsubscriber | null = null;
  _unsubMessage: FirebaseUnsubscriber | null = null;

  constructor(props: PatientDetailPageProps & WithNamespaces) {
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

  changeEbola = async (testIndicatesEbola: boolean) => {
    const authUser = await getAuthUser();
    const diagnoses = [
      ...(this.currentTriage().diagnoses || []),
      {
        tag: ConditionTag.Ebola,
        value: testIndicatesEbola,
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
    const { t } = this.props;
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
          t("updatedDiagnosis"),
          t("resultAvailable"),
          details,
          "triage_evd"
        );
      } else {
        console.warn(
          "No registration token found for phone number " +
            phone +
            ", no notification of triage will be sent"
        );
      }
    }

    this.setState({ tDoc });
  };

  public render(): React.ReactNode {
    const { eDoc: encounter, tDoc: triage, messages } = this.state;
    const { tReady, i18n, t } = this.props;
    return (
      <div className="PatientDetailPage">
        {encounter == null ? (
          <div>{t("common:loading")}</div>
        ) : (
          <div>
            <PatientInfoPane
              eDoc={encounter}
              tDoc={triage}
              tReady={tReady}
              i18n={i18n}
              t={t}
            />
            <TestDetailPane
              eDoc={encounter}
              tDoc={triage}
              tReady={tReady}
              i18n={i18n}
              t={t}
            />
            <TriagePane
              eDoc={encounter}
              tDoc={triage}
              key={JSON.stringify(triage)}
              reload={this.load}
              triageChangedAction={this.triageChangeHandler}
              changeEbola={this.changeEbola}
              changeNotes={this.changeNotes}
              error={this.state.error}
              tReady={tReady}
              i18n={i18n}
              t={t}
            />
            <PhotoPane
              eDoc={encounter}
              tDoc={triage}
              i18n={i18n}
              t={t}
              tReady={tReady}
            />
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

interface PatientInfoPaneProps {
  eDoc: EncounterDocument;
  tDoc: EncounterTriageDocument | null;
}

class PatientInfoPane extends React.Component<
  PatientInfoPaneProps & WithNamespaces
> {
  private renderDiagnosisBubble(diagnosis: Diagnosis) {
    const { t } = this.props;
    const { value: evdPositive, diagnoser, timestamp } = diagnosis;
    const className = evdPositive ? "Positive" : "Negative";
    const message = evdPositive
      ? t("patientInfoPane:likelyPositive")
      : t("patientInfoPane:likelyNegative");
    return (
      // TODOZ: figure out how to implement <strong> tag with tFunction
      <div className={`DiagnosisBubble ${className}`}>
        <div className={`Message ${className}`}>{message}</div>
        <div className="Details">
          <div className="Detail">
            {t("patientInfoPane:reviewedBy")}
            <strong>{diagnoser.name}</strong>
          </div>
          <div className="Detail">
            {t("patientInfoPane:date")}
            <strong>{localeDate(timestamp)}</strong>
          </div>
        </div>
      </div>
    );
  }
  public render(): React.ReactNode {
    const { t } = this.props;
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
            {t("patientInfoPane:toPatientList")}
          </a>
        </div>
        <h3>{t("patientInfoPane:patientInfo")}</h3>
        <table className="DetailTable">
          <thead>
            <tr className="Header">
              <td>{t("patientInfoPane:phoneNumber")}</td>
              <td>{t("patientInfoPane:contact")}</td>
              <td>{t("patientInfoPane:CHWNotes")}</td>
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

class TestDetailPane extends React.Component<
  PatientInfoPaneProps & WithNamespaces
> {
  public render() {
    const { t } = this.props;
    const { encounter } = this.props.eDoc;
    const photo = last(encounter.rdtPhotos);
    const timestamp = photo ? localeDate(photo.timestamp) : t("notTested");
    const chwName =
      encounter.healthWorker.firstName + " " + encounter.healthWorker.lastName;
    const { phone, notes } = encounter.healthWorker;

    return (
      <div>
        <h3>{t("testDetailPane:patientTest")}</h3>
        <table className="DetailTable">
          <thead>
            <tr className="Header">
              <td>{t("testDetailPane:testedOn")}</td>
              <td>{t("testDetailPane:testedBy")}</td>
              <td>{t("testDetailPane:contact")}</td>
              <td>{t("testDetailPane:aboutCHW")}</td>
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
  changeEbola: (evdStatus: boolean) => void;
  changeNotes: (notes: string) => void;
}

interface TriageState {
  busy: boolean;
  noteChanged: boolean;
  notes?: string;
}

class TriagePane extends React.Component<
  TriageProps & WithNamespaces,
  TriageState
> {
  constructor(props: TriageProps & WithNamespaces) {
    super(props);
    this.state = {
      busy: false,
      noteChanged: false,
    };
  }

  onEbolaYes = () => this.props.changeEbola(true);
  onEbolaNo = () => this.props.changeEbola(false);

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
    const { error, t } = this.props;
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
        <h3>{t("triagePane:EbolaPositivity")}</h3>
        <div className="EditDetail">
          <input
            type="button"
            value={t("common:button:YES")}
            name="NAME-test-indicates-evd-yes"
            className={
              diagnosis && diagnosis.value ? "evdPressed" : "evdUnpressed"
            }
            disabled={busy}
            onClick={this.onEbolaYes}
          />
          <input
            type="button"
            value={t("common:button:NO")}
            name="NAME-test-indicates-evd-no"
            className={
              diagnosis && !diagnosis.value ? "evdPressed" : "evdUnpressed"
            }
            disabled={busy}
            onClick={this.onEbolaNo}
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
            value={t("common:button:SAVE")}
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

class PhotoPane extends React.Component<
  PatientInfoPaneProps & WithNamespaces,
  PhotoPaneState
> {
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
    const { t } = this.props;
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
                        <th>{t("photoPane:takenOn")}</th>
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
                      MarkerStatus.EBOLA_UNTRIAGED,
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
                      <th>{t("photoPane:testLocation")}</th>
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
    const { t } = this.props;
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
              {t("photoPane:showPrevious")}
              {t("photoPane:photo", { count: rdtPhotos.length })}
            </summary>
            {rdtPhotos.slice(0, -1).map(this.renderPhoto)}
          </details>
        )}
      </div>
    );
  }
}

const PatientDetailPage = withRouter(
  withNamespaces("patientDetailAssumeRouter")(PatientDetailPageAssumeRouter)
);
const patientInfo = withNamespaces("patientInfoPane")(PatientInfoPane);
const photoPane = withNamespaces("PhotoPane")(PhotoPane);
const testDetail = withNamespaces("testDetailPane")(TestDetailPane);

export { PatientDetailPage, patientInfo, photoPane, testDetail };
