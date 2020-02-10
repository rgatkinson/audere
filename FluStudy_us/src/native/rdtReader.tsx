import { Platform, requireNativeComponent } from "react-native";
import * as React from "react";
import { RDTReaderExposureResult } from "audere-lib/chillsProtocol";

const NativeRDTReader = requireNativeComponent("RDTReader");

type InternalRDTCapturedArgs = {
  imageUri: string;
  previewUri: string;
  previewFrameIndex: number;
  resultWindowImageUri: string;
  testStripDetected: boolean;
  isCentered: boolean;
  isSteady: boolean;
  sharpness: boolean;
  sharpnessRaw: number;
  exposureResult: RDTReaderExposureResult;
  control: boolean;
  testA: boolean;
  testB: boolean;
  boundary?: { x: number; y: number }[];
  failureReason: string;
  intermediateResults?: { [key: string]: string };
  phase1Recognitions?: string[];
  phase2Recognitions?: string[];
};

export type RDTCapturedArgs = {
  imageUri: string;
  previewUri: string;
  previewFrameIndex: number;
  resultWindowImageUri: string;
  testStripDetected: boolean;
  isCentered: boolean;
  isFocused: boolean;
  sharpnessRaw: number;
  isSteady: boolean;
  exposureResult: RDTReaderExposureResult;
  controlLineFound: boolean;
  testALineFound: boolean;
  testBLineFound: boolean;
  testStripBoundary?: { x: number; y: number }[];
  failureReason: string;
  intermediateResults?: { [key: string]: string };
  phase1Recognitions?: string[];
  phase2Recognitions?: string[];
};

export type RDTCameraReadyArgs = {
  supportsTorchMode: boolean;
  screenWidth: number;
  screenHeight: number;
  legacyCameraApi: boolean;
};

export type RDTInterpretingArgs = {
  timeTaken: number;
};

type RDTReaderProps = {
  onRDTCaptured: (args: RDTCapturedArgs) => void;
  onRDTCameraReady: (args: RDTCameraReadyArgs) => void;
  onRDTInterpreting?: (args: RDTInterpretingArgs) => void;
  enabled: boolean;
  flashEnabled: boolean;
  demoMode: boolean;
  showDefaultViewfinder?: boolean;
  frameImageScale: number;
  appState: string;
  processFrames: boolean;
  style: any;
};

export class RDTReader extends React.Component<RDTReaderProps> {
  _onRDTCaptured = (event: any) => {
    const capturedArgs: InternalRDTCapturedArgs = event.nativeEvent;
    this.props.onRDTCaptured({
      imageUri: capturedArgs.imageUri,
      previewUri: capturedArgs.previewUri,
      previewFrameIndex: capturedArgs.previewFrameIndex,
      resultWindowImageUri: capturedArgs.resultWindowImageUri,
      testStripDetected: capturedArgs.testStripDetected,
      isCentered: capturedArgs.isCentered,
      isFocused: capturedArgs.sharpness,
      sharpnessRaw: capturedArgs.sharpnessRaw,
      isSteady: capturedArgs.isSteady,
      exposureResult: capturedArgs.exposureResult,
      controlLineFound: capturedArgs.control,
      testALineFound: capturedArgs.testA,
      testBLineFound: capturedArgs.testB,
      testStripBoundary: capturedArgs.boundary,
      failureReason: capturedArgs.failureReason,
      intermediateResults: capturedArgs.intermediateResults,
      phase1Recognitions: capturedArgs.phase1Recognitions,
      phase2Recognitions: capturedArgs.phase2Recognitions,
    });
  };

  _onRDTCameraReady = (event: any) => {
    if (this.props.onRDTCameraReady) {
      this.props.onRDTCameraReady(event.nativeEvent);
    }
  };

  _onRDTInterpreting = (event: any) => {
    if (this.props.onRDTInterpreting) {
      this.props.onRDTInterpreting(event.nativeEvent);
    }
  };

  render() {
    return (
      <NativeRDTReader
        {...this.props}
        onRDTCaptured={this._onRDTCaptured}
        onRDTCameraReady={this._onRDTCameraReady}
        onRDTInterpreting={this._onRDTInterpreting}
      />
    );
  }
}
