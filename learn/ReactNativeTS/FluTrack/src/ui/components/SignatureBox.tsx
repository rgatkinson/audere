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
import Modal from "./Modal";
import TextInput from "./TextInput";
import { ConsentInfoSignerType } from "audere-lib";

interface Props {
  editableNames: boolean;
  participantName?: string;
  signerName?: string;
  label: string;
  signer: ConsentInfoSignerType;
  open: boolean;
  onDismiss(): void;
  onSubmit(participantName: string, signerName: string, signature: string): void;
}

interface SnapshotImage {
  height: number;
  width: number;
  uri: string;
}

interface State {
  image?: SnapshotImage;
  participantName?: string;
  signerName?: string;
}

// @ts-ignore
const remoteDebugging = typeof DedicatedWorkerGlobalScope !== "undefined";

class SignatureBox extends React.Component<Props & WithNamespaces, State> {
  state: State = {};

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

  _getParticipantName = (): string | undefined => {
    return typeof this.state.participantName == 'undefined' ? this.props.participantName : this.state.participantName;
  }

  _getSignerName = (): string | undefined => {
    if (this.props.signer === ConsentInfoSignerType.Subject) {
      return this._getParticipantName();
    }
    return typeof this.state.signerName == 'undefined' ? this.props.signerName : this.state.signerName;
  }

  _onSubmit = () => {
    const image = this.state.image;
    const participantName = this._getParticipantName()!;
    const signerName = this._getSignerName()!;
    if (!image && !remoteDebugging) {
      Alert.alert(this.props.t("pleaseSign"));
      return;
    } else if (remoteDebugging) {
      this.props.onSubmit(participantName, signerName, 'debugSignature');
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
              this.props.onSubmit(participantName, signerName, base64Data);
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
      <Modal
        height={this.props.signer === ConsentInfoSignerType.Subject ? 425 : 525}
        width={700}
        title={this.props.label}
        visible={this.props.open}
        onDismiss={() => {
          this.setState({ image: undefined, participantName: undefined, signerName: undefined });
          this.props.onDismiss()
        }}
      >
        <View style={styles.container}>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
            <Text style={styles.headerText}>{t("todaysDate")}</Text>
            <Text style={styles.inputContainer}>
              {format(new Date(), "MM/D/YYYY")}
            </Text>
          </View>
          <View>
            <Text style={styles.headerText}>{t("fullName")}</Text>
            <TextInput
              autoFocus={false}
              editable={this.props.editableNames}
              placeholder={t("name")}
              returnKeyType="done"
              style={styles.inputContainer}
              value={this._getParticipantName()}
              onChangeText={text => this.setState({ participantName: text })}
            />
          </View>
          {this.props.signer != ConsentInfoSignerType.Subject ? (
            <View>
              <Text style={styles.headerText}>{t(this.props.signer + "FullName")}</Text>
              <TextInput
                autoFocus={false}
                editable={this.props.editableNames}
                placeholder={t("name")}
                returnKeyType="done"
                style={styles.inputContainer}
                value={this._getSignerName()}
                onChangeText={text => this.setState({ signerName: text })}
              />
            </View>
          ) : null}
          <View style={styles.sketchContainer}>
            <ExpoPixi.Signature
              ref={(ref: any) => (this.sketch = ref)}
              style={styles.sketch}
              onChange={this._onChangeAsync}
            />
            <Text style={styles.textHint}>{this.props.label}</Text>
          </View>
          <View style={styles.buttonRow}>
            <Button
              enabled={true}
              key="clear"
              label={t("surveyButton:clearSignature")}
              primary={false}
              style={{width: 300}}
              onPress={this._onClear}
            />
            <Button
              enabled={
                !!this._getParticipantName()
                && (remoteDebugging || !!this.state.image)
                && (this.props.signer === ConsentInfoSignerType.Subject || !!this._getSignerName())
              }
              key="save"
              label={t("common:button:save")}
              primary={true}
              style={{width: 300}}
              onPress={this._onSubmit}
            />
          </View>
        </View>
      </Modal>
    );
  }
}

const styles = StyleSheet.create({
  buttonRow: {
    alignSelf: "stretch",
    flexDirection: "row",
    justifyContent: "space-between",
  },
  container: {
    flex: 1,
    justifyContent: 'space-between',
    marginHorizontal: 30,
  },
  headerText: {
    fontFamily: "OpenSans-Regular",
    fontSize: 21,
    letterSpacing: -0.51,
    marginVertical: 10,
  },
  inputContainer: {
    fontSize: 20,
    height: 30,
    marginVertical: 10,
    paddingHorizontal: 16,
  },
  sketch: {
    borderRadius: 13,
    flex: 1,
    zIndex: 10,
  },
  sketchContainer: {
    borderColor: "#d6d7da",
    borderWidth: 2,
    borderRadius: 13,
    height: "14%",
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
