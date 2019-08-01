// Copyright (c) 2019 by Audere
//
// Use of this source code is governed by an MIT-style license that
// can be found in the LICENSE file distributed with this file.

import React, { ChangeEvent } from "react";
import { RouteComponentProps, withRouter } from "react-router-dom";

import {
  DocumentType,
  EncounterDocument,
  EncounterTriageDocument,
  EncounterTriageInfo,
  NotificationType,
  Notification
} from "audere-lib/dist/ebPhotoStoreProtocol";
import { getApi, triageDoc } from "./api";
import { localeDate } from "./util";
import { LoggedInAs } from "./LoggedInAs";
import "./PatientDetailPage.css";
import { SimpleMap } from "./SimpleMap";

type InputChangeEvent = ChangeEvent<HTMLInputElement>;
type TextAreaChangeEvent = ChangeEvent<HTMLTextAreaElement>;

export interface PatientDetailMatchParams {
  docId: string;
}

export interface PatientDetailPageProps
  extends RouteComponentProps<PatientDetailMatchParams> {}

export interface PatientDetailPageState {
  eDoc: EncounterDocument | null;
  tDoc: EncounterTriageDocument | null;
}

class PatientDetailPageAssumeRouter extends React.Component<
  PatientDetailPageProps,
  PatientDetailPageState
> {
  constructor(props: PatientDetailPageProps) {
    super(props);
    this.state = { eDoc: null, tDoc: null };
  }

  componentDidMount() {
    this.load();
  }

  private load = async (): Promise<void> => {
    const { docId } = this.props.match.params;
    const api = getApi();

    // TODO: show errors
    const [encounter, triage] = await Promise.all([
      api.loadEncounter(docId),
      api.loadTriage(docId)
    ]);
    this.setState({
      eDoc: (encounter.data() as EncounterDocument) || null,
      tDoc: (triage.data() as EncounterTriageDocument) || null
    });
  };

  triageChangeHandler = async (): Promise<void> => {
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
          notificationType: NotificationType.Diagnosis
        };

        await api.pushNotification(
          doc.token,
          "Updated EVD diagnosis",
          "An encounter was triaged, etc",
          details,
          "triage_evd"
        );
      } else {
        console.warn(`No registration token found for phone number ${phone}, ` +
          `no notification of triage will be sent`);
      }
    }
  }

  public render(): React.ReactNode {
    const { eDoc: encounter, tDoc: triage } = this.state;
    return (
      <div>
        <div className="PatientDetailHeader">
          <div
            style={{
              float: "left",
              clear: "none",
              visibility: "hidden"
            }}
          >
            <LoggedInAs />
          </div>

          <div
            style={{
              float: "right",
              clear: "none"
            }}
          >
            <LoggedInAs />
          </div>

          <div
            className="PatientDetailHeaderTitle"
            style={{
              clear: "none"
            }}
          >
            CHW Ebola Test Tracker
          </div>
        </div>
        <div className="PatientListLink">
          <a href={`/patients/`}>Back to Patient List</a>
        </div>
        {encounter == null ? (
          <div>Loading...</div>
        ) : (
          <div>
            <PatientInfoPane eDoc={encounter}/>
            <TriagePane eDoc={encounter} tDoc={triage} reload={this.load} triageChangedAction={this.triageChangeHandler}/>
            <PhotoPane eDoc={encounter}/>
          </div>
        )}
      </div>
    );
  }
}
export const PatientDetailPage = withRouter(PatientDetailPageAssumeRouter);

interface PatientDetailPaneProps {
  eDoc: EncounterDocument;
}

class PatientInfoPane extends React.Component<PatientDetailPaneProps> {
  public render(): React.ReactNode {
    const { localIndex, patient, notes } = this.props.eDoc.encounter;
    return (
      <div className="PatientInfoPane">
        <h2>
          {patient.firstName} {patient.lastName} (ID: {localIndex})
        </h2>
        <table>
          <tr>
            <td>Phone:</td>
            <td>{patient.phone}</td>
          </tr>
          <tr>
            <td>Contact Details:</td>
            <td>{patient.details}</td>
          </tr>
          <tr>
            <td>Patient Details:</td>
            <td>{notes}</td>
          </tr>
        </table>
      </div>
    );
  }
}

interface TriageProps extends PatientDetailPaneProps {
  reload: () => Promise<void>;
  tDoc: EncounterTriageDocument | null;
  triageChangedAction: () => Promise<void>;
}

interface TriageState {
  busy: boolean;

  edited: EncounterTriageInfo;
  error: string | null;
}

class TriagePane extends React.Component<TriageProps, TriageState> {
  constructor(props: TriageProps) {
    super(props);
    const { triage } = props.tDoc || triageDoc("", "", false);
    this.state = {
      busy: false,
      error: null,
      edited: triage
    };
  }

  changeEVD(testIndicatesEVD: boolean) {
    this.setState({
      edited: {
        ...this.state.edited,
        testIndicatesEVD
      }
    });
    this.save(testIndicatesEVD);
  }

  onEVDYes = () => this.changeEVD(true);
  onEVDNo = () => this.changeEVD(false);

  onNotesChange = (e: TextAreaChangeEvent) =>
    this.setState({
      edited: {
        ...this.state.edited,
        notes: e.target.value
      }
    });

  save = async (testIndicatesEVD: boolean) => {
    this.setState({ busy: true });
    const { docId } = this.props.eDoc;
    const { notes } = this.state.edited;
    const api = getApi();
    try {
      await api.saveTriage(triageDoc(docId, notes, testIndicatesEVD));
      await this.props.triageChangedAction();
      this.setState({ busy: false });
    } catch (err) {
      this.setState({ busy: false, error: err.message });
    }
  };

  public render(): React.ReactNode {
    const { busy, edited, error } = this.state;
    const { testIndicatesEVD } = edited;
    return (
      <div className="TriagePane">
        <h3>Does the below image indicate EVD positivity?</h3>
        <div className="EditDetail">
          <input
            type="button"
            value="Yes"
            name="NAME-test-indicates-evd-yes"
            className={testIndicatesEVD ? "evdPressed" : "evdUnpressed"}
            disabled={busy}
            onClick={this.onEVDYes}
          />
          <input
            type="button"
            value="No"
            name="NAME-test-indicates-evd-no"
            className={testIndicatesEVD ? "evdUnpressed" : "evdPressed"}
            disabled={busy}
            onClick={this.onEVDNo}
          />
        </div>

        {error != null && <div className="Error">{error}</div>}
      </div>
    );
  }
}

interface PhotoPaneState {
  urls: PhotoFetchResult[];
}

interface PhotoFetchResult {
  url?: string;
  error?: Error;
}

class PhotoPane extends React.Component<
  PatientDetailPaneProps,
  PhotoPaneState
> {
  constructor(props: PatientDetailPaneProps) {
    super(props);
    this.state = {
      urls: props.eDoc.encounter.rdtPhotos.map(x => ({} as PhotoFetchResult))
    };

    const { rdtPhotos } = this.props.eDoc.encounter;
    rdtPhotos.forEach(async (photo, i) => {
      const url = await this.getUrl(photo.photoId);
      const urls = [...this.state.urls];
      urls.splice(i, 1, url);
      this.setState({ urls });
    });
  }

  private async getUrl(photoId: string): Promise<PhotoFetchResult> {
    try {
      return { url: await getApi().photoUrl(photoId) };
    } catch (error) {
      return { error };
    }
  }

  public render(): React.ReactNode {
    const { rdtPhotos } = this.props.eDoc.encounter;
    const { healthWorker } = this.props.eDoc.encounter;
    const { urls } = this.state;
    return (
      <div>
        {rdtPhotos.map((photo, i) => {
          const { url, error } =
            urls[i] ||
            ({ error: new Error(JSON.stringify(urls)) } as PhotoFetchResult);
          return (
            <div className="PhotoPane">
              <table>
                <tr>
                  <td>
                    {url != null && (
                      // CSS hack to avoid modifying the image aspect ratio,
                      // while supporting right-click "Save Image As".
                      <div
                        style={{
                          height: "400px",
                          width: "400px",
                          backgroundImage: `url(${url})`,
                          backgroundSize: "contain",
                          backgroundPosition: "center center",
                          backgroundRepeat: "no-repeat",
                          backgroundColor: "gray",
                          marginRight: "1rem",
                          marginBottom: "0.5rem"
                        }}
                      >
                        <img
                          src={url}
                          width="100%"
                          height="100%"
                          alt="RDT Result"
                          style={{
                            opacity: 0
                          }}
                        />
                      </div>
                    )}
                    <table>
                      <tr>
                        <th>Tested On:</th>
                      </tr>
                      <tr>
                        <td>{localeDate(photo.timestamp)}</td>
                      </tr>
                      <tr>
                        <td>
                          <br />
                        </td>
                      </tr>
                      <tr>
                        <th>Tested By:</th>
                      </tr>
                      <tr>
                        <td>
                          {healthWorker.firstName} {healthWorker.lastName}
                        </td>
                      </tr>
                      <tr>
                        <td>{healthWorker.phone}</td>
                      </tr>
                      <tr>({healthWorker.notes})</tr>
                      <tr>
                        <td>
                          <br />
                        </td>
                      </tr>
                    </table>
                  </td>
                  <td>
                    <SimpleMap
                      encounters={[this.props.eDoc]}
                      style={{
                        height: "400px",
                        width: "400px",
                        marginBottom: "0.5rem"
                      }}
                    />
                    <table>
                      <tr>
                        <th>Location:</th>
                      </tr>
                      <tr>
                        <td>Latitude: {photo.gps.latitude}</td>
                      </tr>
                      <tr>
                        <td>Longitude: {photo.gps.longitude}</td>
                      </tr>
                    </table>
                  </td>
                </tr>
              </table>
              {error != null && <div>ERROR: {error.message}</div>}
            </div>
          );
        })}
      </div>
    );
  }
}
