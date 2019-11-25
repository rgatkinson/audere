import { Platform, requireNativeComponent } from "react-native";
import * as React from "react";
import {
  RDTReaderExposureResult,
  RDTReaderSizeResult,
} from "audere-lib/chillsProtocol";

const NativeRDTReader = requireNativeComponent("RDTReader");

type InternalRDTCapturedArgs = {
  imageUri: string;
  resultWindowImageUri: string;
  passed: boolean;
  testStripDetected: boolean;
  center: boolean;
  fiducial: boolean;
  sizeResult: RDTReaderSizeResult;
  shadow: boolean;
  target: number;
  sharpness: boolean;
  orientation: boolean;
  angle: number;
  exposureResult: RDTReaderExposureResult;
  control: boolean;
  testA: boolean;
  testB: boolean;
  boundary?: { x: number; y: number }[];
  viewportDimensions?: { width: number; height: number };
};

export type RDTCapturedArgs = {
  imageUri: string;
  resultWindowImageUri: string;
  testStripFound: boolean;
  testStripDetected: boolean;
  fiducialFound: boolean;
  isCentered: boolean;
  sizeResult: RDTReaderSizeResult;
  isFocused: boolean;
  isRightOrientation: boolean;
  angle: number;
  exposureResult: RDTReaderExposureResult;
  controlLineFound: boolean;
  testALineFound: boolean;
  testBLineFound: boolean;
  testStripBoundary?: { x: number; y: number }[];
  viewportDimensions?: { width: number; height: number };
};

export type RDTCameraReadyArgs = {
  supportsTorchMode: boolean;
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
  style: any;
};

export class RDTReader extends React.Component<RDTReaderProps> {
  _onRDTCaptured = (event: any) => {
    const capturedArgs: InternalRDTCapturedArgs = event.nativeEvent;
    this.props.onRDTCaptured({
      imageUri: capturedArgs.imageUri,
      resultWindowImageUri: capturedArgs.resultWindowImageUri,
      testStripFound: capturedArgs.passed,
      testStripDetected: capturedArgs.testStripDetected,
      isCentered: capturedArgs.center,
      fiducialFound: capturedArgs.fiducial,
      sizeResult: capturedArgs.sizeResult,
      isFocused: capturedArgs.sharpness,
      angle: capturedArgs.angle,
      isRightOrientation: capturedArgs.orientation,
      exposureResult: capturedArgs.exposureResult,
      controlLineFound: capturedArgs.control,
      testALineFound: capturedArgs.testA,
      testBLineFound: capturedArgs.testB,
      testStripBoundary: capturedArgs.boundary,
      viewportDimensions: capturedArgs.viewportDimensions,
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
