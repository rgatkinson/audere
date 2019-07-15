import { Platform, requireNativeComponent } from "react-native";
import * as React from "react";
import {
  RDTReaderExposureResult,
  RDTReaderSizeResult,
} from "audere-lib/coughProtocol";

const NativeRDTReader = requireNativeComponent("RDTReader");

type InternalRDTCapturedArgs = {
  img: string;
  resultWindowImg: string;
  passed: boolean;
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
};

export type RDTCapturedArgs = {
  imgBase64: string;
  resultWindowImgBase64: string;
  testStripFound: boolean;
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
};

export type RDTInterpretingArgs = {
  timeTaken: number;
};

type RDTReaderProps = {
  onRDTCaptured: (args: RDTCapturedArgs) => void;
  onRDTCameraReady: (args: {}) => void;
  onRDTInterpreting?: (args: RDTInterpretingArgs) => void;
  enabled: boolean;
  flashEnabled: boolean;
  showDefaultViewfinder?: boolean;
  style: any;
};

export class RDTReader extends React.Component<RDTReaderProps> {
  _onRDTCaptured = (event: any) => {
    const capturedArgs: InternalRDTCapturedArgs = event.nativeEvent;
    this.props.onRDTCaptured({
      imgBase64: capturedArgs.img,
      resultWindowImgBase64: capturedArgs.resultWindowImg,
      testStripFound: capturedArgs.passed,
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
    });
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
        onRDTInterpreting={this._onRDTInterpreting}
      />
    );
  }
}
