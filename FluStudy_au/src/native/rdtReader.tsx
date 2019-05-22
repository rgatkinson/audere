import { requireNativeComponent } from "react-native";
import * as React from "react";

const NativeRDTReader = requireNativeComponent("RDTReader");

export enum ExposureResult {
  UNDER_EXPOSED,
  NORMAL,
  OVER_EXPOSED,
}
export enum SizeResult {
  RIGHT_SIZE,
  LARGE,
  SMALL,
  INVALID,
}
type InternalRDTCapturedArgs = {
  img: string;
  passed: boolean;
  center: boolean;
  sizeResult: SizeResult;
  shadow: boolean;
  target: number;
  sharpness: boolean;
  orientation: boolean;
  exposureResult: ExposureResult;
  control: boolean;
  testA: boolean;
  testB: boolean;
};

export type RDTCapturedArgs = {
  imgBase64: string;
  testStripFound: boolean;
  isCentered: boolean;
  sizeResult: SizeResult;
  isFocused: boolean;
  isRightOrientation: boolean;
  exposureResult: ExposureResult;
  controlLineFound: boolean;
  testALineFound: boolean;
  testBLineFound: boolean;
};

type RDTReaderProps = {
  onRDTCaptured: (args: RDTCapturedArgs) => void;
  onRDTCameraReady: (args: {}) => void;
  enabled: boolean;
  style: any;
};

export class RDTReader extends React.Component<RDTReaderProps> {
  _onRDTCaptured = (event: any) => {
    const capturedArgs: InternalRDTCapturedArgs = event.nativeEvent;
    capturedArgs.img = "data:image/png;base64, " + capturedArgs.img;
    this.props.onRDTCaptured({
      imgBase64: capturedArgs.img,
      testStripFound: capturedArgs.passed,
      isCentered: capturedArgs.center,
      sizeResult: capturedArgs.sizeResult,
      isFocused: capturedArgs.sharpness,
      isRightOrientation: capturedArgs.orientation,
      exposureResult: capturedArgs.exposureResult,
      controlLineFound: capturedArgs.control,
      testALineFound: capturedArgs.testA,
      testBLineFound: capturedArgs.testB,
    });
  };

  render() {
    return (
      <NativeRDTReader {...this.props} onRDTCaptured={this._onRDTCaptured} />
    );
  }
}
