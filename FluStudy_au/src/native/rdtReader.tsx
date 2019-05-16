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
export type RDTCapturedArgs = {
  img: string;
  passed: boolean;
  center: boolean;
  sizeResult: SizeResult;
  matchDistance: number;
  shadow: boolean;
  target: number;
  sharpness: boolean;
  orientation: boolean;
  exposureResult: ExposureResult;
};

export type ExternalRDTCapturedArgs = {
  imgBase64: string;
  testStripFound: boolean;
  isCentered: boolean;
  sizeResult: SizeResult;
  matchDistance: number;
  isFocused: boolean;
  isRightOrientation: boolean;
  exposureResult: ExposureResult;
};

type RDTReaderProps = {
  onRDTCaptured: (args: ExternalRDTCapturedArgs) => void;
  onRDTCameraReady: (args: {}) => void;
  enabled: boolean;
  style: any;
};

export class RDTReader extends React.Component<RDTReaderProps> {
  _onRDTCaptured = (event: any) => {
    const capturedArgs: RDTCapturedArgs = event.nativeEvent;
    capturedArgs.img = "data:image/jpg;base64, " + capturedArgs.img;
    this.props.onRDTCaptured({
      imgBase64: capturedArgs.img,
      testStripFound: capturedArgs.passed,
      isCentered: capturedArgs.center,
      sizeResult: capturedArgs.sizeResult,
      matchDistance: capturedArgs.matchDistance,
      isFocused: capturedArgs.sharpness,
      isRightOrientation: capturedArgs.orientation,
      exposureResult: capturedArgs.exposureResult,
    });
  };

  render() {
    return (
      <NativeRDTReader {...this.props} onRDTCaptured={this._onRDTCaptured} />
    );
  }
}
