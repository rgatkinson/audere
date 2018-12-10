import React from "react";
import {
  Alert,
  ImageEditor,
  ImageStore,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { WithNamespaces, withNamespaces } from "react-i18next";
import { format } from "date-fns";
import * as ExpoPixi from "expo-pixi";
import Button from "./Button";

interface Props {
  canSubmit: boolean;
  onSubmit(base64data: string): void;
}

interface SnapshotImage {
  height: number;
  width: number;
  uri: string;
}

interface State {
  image: undefined | SnapshotImage;
}

// @ts-ignore
const remoteDebugging = typeof DedicatedWorkerGlobalScope !== "undefined";

class SignatureBox extends React.Component<Props & WithNamespaces, State> {
  sketch: any;

  _onChangeAsync = async () => {
    const image: SnapshotImage = await this.sketch.takeSnapshotAsync({
      format: "png",
    });
    this.setState({ image });
  };

  _onClear = () => {
    this.sketch.clear();
    this.setState({ image: undefined });
  };

  _onSubmit = () => {
    const image = this.state && this.state.image;
    if (!image && !remoteDebugging) {
      Alert.alert(this.props.t("pleaseSign"));
      return;
    } else if (remoteDebugging) {
      this.props.onSubmit('debugSignature');
    } else if (!!image) {
      const cropData = {
        offset: { x: 0, y: 0 },
        size: {
          width: image.width,
          height: image.height,
        },
        displaySize: { width: 600, height: 130 }, // shrink the PNG to this max width and height
        resizeMode: "contain" as "contain", // preserve aspect ratio
      };

      ImageEditor.cropImage(
        image.uri,
        cropData,
        imageURI => {
          ImageStore.getBase64ForTag(
            imageURI,
            (base64Data: string) => {
              this.props.onSubmit(base64Data);
            },
            reason => console.error(reason)
          );
        },
        reason => console.error(reason)
      );
    }
  };

  render() {
    const { t } = this.props;
    return (
      <View>
        <View style={styles.sketchContainer}>
          <ExpoPixi.Signature
            ref={(ref: any) => (this.sketch = ref)}
            style={styles.sketch}
            onChange={this._onChangeAsync}
          />
          <Text style={styles.textHint}>{t("signature")}</Text>
        </View>
        <View style={styles.buttonRow}>
          <Button
            enabled={true}
            key="clear"
            label={t("surveyButton:clearSignature")}
            primary={false}
            onPress={this._onClear}
          />
          <Button
            enabled={(remoteDebugging || (!!this.state && !!this.state.image)) && this.props.canSubmit}
            key="submit"
            label={t("surveyButton:submit")}
            primary={true}
            onPress={this._onSubmit}
          />
        </View>
      </View>
    );
  }
}

const styles = StyleSheet.create({
  buttonRow: {
    alignSelf: "stretch",
    flexDirection: "row",
    justifyContent: "space-between",
    marginHorizontal: 30,
  },
  sketch: {
    borderRadius: 13,
    flex: 1,
    zIndex: 10,
  },
  sketchContainer: {
    backgroundColor: "white",
    borderRadius: 13,
    height: "14%",
    marginHorizontal: 30,
    marginTop: 10,
    minHeight: 130,
    overflow: "hidden",
  },
  textHint: {
    color: "#aaa",
    left: 20,
    bottom: 8,
    zIndex: 20,
    position: "absolute",
  },
});

export default withNamespaces("signatureBox")<Props>(SignatureBox);
