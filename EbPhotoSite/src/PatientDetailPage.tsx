// Copyright (c) 2019 by Audere
//
// Use of this source code is governed by an MIT-style license that
// can be found in the LICENSE file distributed with this file.

import deepEqual from "deep-equal";
import React, { ChangeEvent } from 'react';
import { RouteComponentProps, withRouter } from "react-router-dom";

import { EncounterDocument, EncounterTriageDocument, EncounterTriageInfo } from "audere-lib/dist/ebPhotoStoreProtocol";
import { getApi, triageDoc } from "./api";

type InputChangeEvent = ChangeEvent<HTMLInputElement>;
type TextAreaChangeEvent = ChangeEvent<HTMLTextAreaElement>;

export interface PatientDetailMatchParams {
  docId: string;
}

export interface PatientDetailPageProps extends RouteComponentProps<PatientDetailMatchParams> {
}

export interface PatientDetailPageState {
  eDoc: EncounterDocument | null;
  tDoc: EncounterTriageDocument | null;
}

class PatientDetailPageAssumeRouter extends React.Component<PatientDetailPageProps, PatientDetailPageState> {
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
      eDoc: encounter.data() as EncounterDocument || null,
      tDoc: triage.data() as EncounterTriageDocument || null,
    });
  }

  public render(): React.ReactNode {
    const { eDoc: encounter, tDoc: triage } = this.state;
    return encounter == null ? (
      <div>Loading...</div>
    ) : (
      <div>
        <PatientInfoPane eDoc={encounter}/>
        <HealthWorkerPane eDoc={encounter}/>
        <TriagePane eDoc={encounter} tDoc={triage} reload={this.load}/>
        <PhotoPane eDoc={encounter}/>
      </div>
    );
  }
}
export const PatientDetailPage = withRouter(PatientDetailPageAssumeRouter);

interface PatientDetailPaneProps {
  eDoc: EncounterDocument;
}

class HealthWorkerPane extends React.Component<PatientDetailPaneProps> {
  public render(): React.ReactNode {
    const { healthWorker } = this.props.eDoc.encounter;
    return (
      <div className="HealthWorkerPane">
        <h2>Health Worker</h2>
        <table>
          <tr><td>Name:</td><td>{healthWorker.firstName} {healthWorker.lastName}</td></tr>
          <tr><td>Phone:</td><td>{healthWorker.phone}</td></tr>
          <tr><td>Notes:</td>{healthWorker.notes}</tr>
        </table>
      </div>
    );
  }
}

class PatientInfoPane extends React.Component<PatientDetailPaneProps> {
  public render(): React.ReactNode {
    const { localIndex, patient } = this.props.eDoc.encounter;
    return (
      <div className="PatientInfoPane">
        <h2>Patient</h2>
        <table>
          <tr><td>Local ID:</td><td>{localIndex}</td></tr>
          <tr><td>Name:</td><td>{patient.firstName} {patient.lastName}</td></tr>
          <tr><td>Phone:</td><td>{patient.phone}</td></tr>
          <tr><td>Details:</td><td>{patient.details}</td></tr>
        </table>
      </div>
    );
  }
}

interface TriageProps extends PatientDetailPaneProps {
  reload: () => Promise<void>
  tDoc: EncounterTriageDocument | null,
}

interface TriageState {
  busy: boolean;
  original: EncounterTriageInfo,
  edited: EncounterTriageInfo,
  error: string | null;
}

class TriagePane extends React.Component<TriageProps, TriageState> {
  constructor(props: TriageProps) {
    super(props);
    const { triage } = props.tDoc || triageDoc("", "", false);
    this.state = {
      busy: false,
      error: null,
      original: triage,
      edited: triage,
    };
  }

  onEVDChange = (e: InputChangeEvent) => this.setState({
    edited: {
      ...this.state.edited,
      testIndicatesEVD: e.target.checked
    }
  });
  onNotesChange = (e: TextAreaChangeEvent) => this.setState({
    edited: {
      ...this.state.edited,
      notes: e.target.value
    }
});

  save = async() => {
    this.setState({ busy: true });
    const { docId } = this.props.eDoc;
    const { notes, testIndicatesEVD } = this.state.edited;
    const api = getApi();
    try {
      await api.saveTriage(triageDoc(docId, notes, testIndicatesEVD));
      this.setState({ busy: false, original: this.state.edited });
    } catch (err) {
      this.setState({ busy: false, error: err.message });
    }
  }

  public render(): React.ReactNode {
    const { busy, edited, original, error } = this.state;
    const { notes, testIndicatesEVD } = edited;
    return (
      <div className="TriagePane">
        <h2>Triage</h2>

        <div className="EditDetail">
          <label htmlFor="test-indicates-evd">Test Indicates EVD:</label>
          <input
            type="checkbox"
            name="NAME-test-indicates-evd"
            checked={testIndicatesEVD}
            disabled={busy}
            onChange={this.onEVDChange}
          />
        </div>

        <div className="EditDetail">
          <label htmlFor="notes">Notes:</label>
          <textarea
            id="notes"
            disabled={busy}
            value={notes}
            onChange={this.onNotesChange}
          />
        </div>

        {error != null &&
          <div className="Error">{error}</div>
        }

        <button
          type="button"
          disabled={busy || deepEqual(edited, original, { strict: true })}
          onClick={this.save}
        >Save</button>
      </div>
    );
  }
}

interface PhotoPaneState {
  urls: PhotoFetchResult[],
}

interface PhotoFetchResult {
  url?: string,
  error?: Error,
}

class PhotoPane extends React.Component<PatientDetailPaneProps, PhotoPaneState> {

  constructor(props: PatientDetailPaneProps) {
    super(props);
    this.state = {
      urls: props.eDoc.encounter.rdtPhotos.map(x => ({} as PhotoFetchResult)),
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
    const { urls } = this.state;
    return (
      <div>{
        rdtPhotos.map((photo, i) => {
          const { url, error } = urls[i] ||
            ({error: new Error(JSON.stringify(urls))} as PhotoFetchResult);
          return (
            <div className="PhotoPane">
              <h2>RDT Photo</h2>
              <table>
                <tr><td>Timestamp:</td><td>{photo.timestamp}</td></tr>
                <tr><td>Latitude:</td><td>{photo.gps.latitude}</td></tr>
                <tr><td>Longitude:</td>{photo.gps.longitude}</tr>
              </table>
              {url != null && (
                // CSS hack to avoid modifying the image aspect ratio,
                // while supporting right-click "Save Image As".
                <div style={{
                  height: "400px",
                  width: "400px",
                  backgroundImage: `url(${url})`,
                  backgroundSize: "contain",
                  backgroundPosition: "center center",
                  backgroundRepeat: "no-repeat",
                  backgroundColor: "gray",
                }}>
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
              {error != null && <div>ERROR: {error.message}</div>}
            </div>
          );
        })
      }</div>
    );
  }
}
